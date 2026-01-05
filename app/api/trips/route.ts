// app/api/trips/route.ts

import { NextResponse } from 'next/server';

async function getDb() {
  const { sql } = await import('@/lib/db');
  return sql;
}

async function getAuth() {
  const { auth } = await import('@/lib/auth');
  return auth;
}

// GET - fetch user's trips
export async function GET() {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ trips: [] });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      return NextResponse.json({ trips: [] });
    }
    const userId = userResult[0].id;

    const trips = await sql`
      SELECT
        ut.*,
        (
          SELECT json_agg(json_build_object(
            'id', tg.id,
            'gearName', tg.gear_name,
            'category', tg.gear_category,
            'isOwned', tg.is_owned,
            'isRecommended', tg.is_recommended,
            'wasUsed', tg.was_used,
            'wouldBringAgain', tg.would_bring_again,
            'usageNotes', tg.usage_notes
          ))
          FROM trip_gear tg
          WHERE tg.trip_id = ut.id
        ) as gear
      FROM user_trips ut
      WHERE ut.user_id = ${userId}
      ORDER BY ut.created_at DESC
    `;

    return NextResponse.json({
      trips: trips.map((t: any) => ({
        id: t.id,
        name: t.trip_name,
        region: t.trip_region,
        duration: t.trip_duration,
        terrain: t.trip_terrain,
        conditions: t.trip_conditions,
        grading: t.trip_grading,
        hazards: t.trip_hazards,
        status: t.status,
        plannedDate: t.planned_date,
        completedDate: t.completed_date,
        actualDuration: t.actual_duration,
        notes: t.notes,
        missingGear: t.missing_gear,
        gear: t.gear || [],
        createdAt: t.created_at,
        // New completion fields
        completionStatus: t.completion_status,
        trailRating: t.trail_rating,
        trailReview: t.trail_review,
        maxElevation: t.max_elevation,
        conditionsEncountered: t.conditions_encountered,
      })),
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ trips: [], error: String(error) });
  }
}

// POST - save a trip setup
export async function POST(request: Request) {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    let userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      userResult = await sql`
        INSERT INTO users (email, name, image, created_at)
        VALUES (${session.user.email}, ${session.user.name || 'User'}, ${session.user.image || null}, NOW())
        RETURNING id
      `;
    }
    const userId = userResult[0].id;

    const { trip, gear, missingGear, plannedDate } = await request.json();

    if (!trip?.name) {
      return NextResponse.json({ error: 'Trip name required' }, { status: 400 });
    }

    // Create the trip
    const tripResult = await sql`
      INSERT INTO user_trips (
        user_id, trip_name, trip_region, trip_duration, trip_terrain,
        trip_conditions, trip_grading, trip_hazards, missing_gear, planned_date
      )
      VALUES (
        ${userId},
        ${trip.name},
        ${trip.region || null},
        ${trip.duration || null},
        ${trip.terrain || null},
        ${trip.conditions ? JSON.stringify(trip.conditions) : null}::jsonb,
        ${trip.grading ? JSON.stringify(trip.grading) : null}::jsonb,
        ${trip.hazards || null},
        ${missingGear ? JSON.stringify(missingGear) : null}::jsonb,
        ${plannedDate || null}
      )
      RETURNING id
    `;
    const tripId = tripResult[0].id;

    // Add gear to the trip
    if (gear && gear.length > 0) {
      for (const g of gear) {
        await sql`
          INSERT INTO trip_gear (trip_id, gear_catalog_id, user_gear_id, gear_name, gear_category, is_owned, is_recommended)
          VALUES (
            ${tripId},
            ${g.catalogId || null},
            ${g.userGearId || null},
            ${g.name},
            ${g.category || null},
            ${g.isOwned || false},
            ${g.isRecommended || false}
          )
        `;

        // Also add owned gear to user's portfolio
        if (g.isOwned && g.name) {
          // Find or create in gear_catalog
          let catalogResult = await sql`
            SELECT id FROM gear_catalog WHERE LOWER(name) = ${g.name.toLowerCase()} LIMIT 1
          `;

          let catalogId;
          if (catalogResult[0]) {
            catalogId = catalogResult[0].id;
          } else {
            const newCatalog = await sql`
              INSERT INTO gear_catalog (name, category)
              VALUES (${g.name}, ${g.category || null})
              RETURNING id
            `;
            catalogId = newCatalog[0].id;
          }

          // Add to user_gear if not already there
          await sql`
            INSERT INTO user_gear (user_id, gear_id, category)
            VALUES (${userId}, ${catalogId}, ${g.category || null})
            ON CONFLICT DO NOTHING
          `;
        }
      }
    }

    return NextResponse.json({ success: true, tripId });
  } catch (error) {
    console.error('Error saving trip:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// PATCH - update trip (mark complete, etc.)
export async function PATCH(request: Request) {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userResult[0].id;

    const {
      tripId,
      status,
      completedDate,
      actualDuration,
      notes,
      // New completion fields
      completionStatus,
      trailRating,
      trailReview,
      maxElevation,
      conditionsEncountered,
      // Gear usage updates
      gearUpdates
    } = await request.json();

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Update trip
    await sql`
      UPDATE user_trips SET
        status = COALESCE(${status || null}, status),
        completed_date = COALESCE(${completedDate || null}, completed_date),
        actual_duration = COALESCE(${actualDuration || null}, actual_duration),
        notes = COALESCE(${notes || null}, notes),
        completion_status = COALESCE(${completionStatus || null}, completion_status),
        trail_rating = COALESCE(${trailRating || null}, trail_rating),
        trail_review = COALESCE(${trailReview || null}, trail_review),
        max_elevation = COALESCE(${maxElevation || null}, max_elevation),
        conditions_encountered = COALESCE(${conditionsEncountered || null}, conditions_encountered),
        updated_at = NOW()
      WHERE id = ${tripId} AND user_id = ${userId}
    `;

    // Update gear usage if provided
    if (gearUpdates && Array.isArray(gearUpdates)) {
      for (const gear of gearUpdates) {
        if (gear.id) {
          await sql`
            UPDATE trip_gear SET
              was_used = COALESCE(${gear.wasUsed}, was_used),
              would_bring_again = COALESCE(${gear.wouldBringAgain}, would_bring_again),
              usage_notes = COALESCE(${gear.usageNotes || null}, usage_notes)
            WHERE id = ${gear.id}
          `;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating trip:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE - remove a trip
export async function DELETE(request: Request) {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('id');

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userResult[0].id;

    await sql`DELETE FROM user_trips WHERE id = ${tripId} AND user_id = ${userId}`;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
