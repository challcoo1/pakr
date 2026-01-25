// app/api/trips/route.ts

import { NextResponse } from 'next/server';
import { normalizeName } from '@/lib/normalize';

async function getDb() {
  const { sql } = await import('@/lib/db');
  return sql;
}

async function getAuth() {
  const { auth } = await import('@/lib/auth');
  return auth;
}

// GET - fetch user's trips with pagination
export async function GET(request: Request) {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ trips: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      return NextResponse.json({ trips: [], total: 0, page: 1, limit: 20, totalPages: 0 });
    }
    const userId = userResult[0].id;

    // Parse pagination params
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // Get total count
    const countResult = await sql`SELECT COUNT(*) as total FROM user_trips WHERE user_id = ${userId}`;
    const total = parseInt(countResult[0]?.total || '0');
    const totalPages = Math.ceil(total / limit);

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
      LIMIT ${limit} OFFSET ${offset}
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
      total,
      page,
      limit,
      totalPages,
    });
  } catch (error) {
    console.error('Error fetching trips:', error);
    return NextResponse.json({ trips: [], total: 0, page: 1, limit: 20, totalPages: 0, error: String(error) });
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

    // Add gear to the trip using batch operations to avoid N+1 queries
    if (gear && gear.length > 0) {
      // Step 1: Batch insert all trip_gear records
      const tripGearValues = gear.map((g: any) => ({
        tripId,
        catalogId: g.catalogId || null,
        userGearId: g.userGearId || null,
        name: g.name,
        category: g.category || null,
        isOwned: g.isOwned || false,
        isRecommended: g.isRecommended || false,
      }));

      // Insert trip_gear in batch using unnest
      await sql`
        INSERT INTO trip_gear (trip_id, gear_catalog_id, user_gear_id, gear_name, gear_category, is_owned, is_recommended)
        SELECT * FROM unnest(
          ${tripGearValues.map((v: any) => v.tripId)}::uuid[],
          ${tripGearValues.map((v: any) => v.catalogId)}::uuid[],
          ${tripGearValues.map((v: any) => v.userGearId)}::uuid[],
          ${tripGearValues.map((v: any) => v.name)}::text[],
          ${tripGearValues.map((v: any) => v.category)}::text[],
          ${tripGearValues.map((v: any) => v.isOwned)}::boolean[],
          ${tripGearValues.map((v: any) => v.isRecommended)}::boolean[]
        )
      `;

      // Step 2: Handle owned gear - add to user's portfolio
      const ownedGear = gear.filter((g: any) => g.isOwned && g.name);
      if (ownedGear.length > 0) {
        // Get normalized names for lookup
        const normalizedNames = ownedGear.map((g: any) => normalizeName(g.name));

        // Batch lookup existing catalog entries
        const existingCatalog = await sql`
          SELECT id, normalized_name FROM gear_catalog
          WHERE normalized_name = ANY(${normalizedNames})
        `;
        const existingMap = new Map(existingCatalog.map((r: any) => [r.normalized_name, r.id]));

        // Find gear that needs to be created
        const toCreate = ownedGear.filter((g: any) => !existingMap.has(normalizeName(g.name)));

        // Batch insert new catalog entries
        if (toCreate.length > 0) {
          const newCatalogEntries = await sql`
            INSERT INTO gear_catalog (name, normalized_name, category)
            SELECT * FROM unnest(
              ${toCreate.map((g: any) => g.name)}::text[],
              ${toCreate.map((g: any) => normalizeName(g.name))}::text[],
              ${toCreate.map((g: any) => g.category || null)}::text[]
            )
            RETURNING id, normalized_name
          `;
          newCatalogEntries.forEach((r: any) => existingMap.set(r.normalized_name, r.id));
        }

        // Batch insert user_gear entries
        const userGearValues = ownedGear.map((g: any) => ({
          userId,
          gearId: existingMap.get(normalizeName(g.name)),
          category: g.category || null,
        })).filter((v: any) => v.gearId);

        if (userGearValues.length > 0) {
          await sql`
            INSERT INTO user_gear (user_id, gear_id, category)
            SELECT * FROM unnest(
              ${userGearValues.map((v: any) => v.userId)}::uuid[],
              ${userGearValues.map((v: any) => v.gearId)}::uuid[],
              ${userGearValues.map((v: any) => v.category)}::text[]
            )
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

    // Update gear usage if provided - batch update to avoid N+1
    if (gearUpdates && Array.isArray(gearUpdates)) {
      const validUpdates = gearUpdates.filter((g: any) => g.id);
      if (validUpdates.length > 0) {
        // Use a CTE with unnest to batch update
        await sql`
          UPDATE trip_gear AS tg SET
            was_used = COALESCE(updates.was_used, tg.was_used),
            would_bring_again = COALESCE(updates.would_bring_again, tg.would_bring_again),
            usage_notes = COALESCE(updates.usage_notes, tg.usage_notes)
          FROM (
            SELECT * FROM unnest(
              ${validUpdates.map((g: any) => g.id)}::uuid[],
              ${validUpdates.map((g: any) => g.wasUsed ?? null)}::boolean[],
              ${validUpdates.map((g: any) => g.wouldBringAgain ?? null)}::boolean[],
              ${validUpdates.map((g: any) => g.usageNotes || null)}::text[]
            ) AS t(id, was_used, would_bring_again, usage_notes)
          ) AS updates
          WHERE tg.id = updates.id
        `;
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
