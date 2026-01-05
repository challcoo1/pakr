// app/api/reviews/route.ts
// User reviews for gear they own

import { NextResponse } from 'next/server';

async function getDb() {
  const { sql } = await import('@/lib/db');
  return sql;
}

async function getAuth() {
  const { auth } = await import('@/lib/auth');
  return auth;
}

// GET - fetch reviews for a gear item, or user's reviews
export async function GET(request: Request) {
  try {
    const sql = await getDb();
    const { searchParams } = new URL(request.url);
    const gearId = searchParams.get('gearId');
    const userOnly = searchParams.get('userOnly') === 'true';

    if (userOnly) {
      // Get current user's reviews
      const auth = await getAuth();
      const session = await auth();
      if (!session?.user?.email) {
        return NextResponse.json({ reviews: [] });
      }

      const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
      if (!userResult[0]) {
        return NextResponse.json({ reviews: [] });
      }

      const reviews = await sql`
        SELECT
          gr.id,
          gr.rating,
          gr.title,
          gr.review,
          gr.conditions,
          gr.created_at,
          gr.updated_at,
          gc.id as gear_id,
          gc.name as gear_name,
          gc.manufacturer as gear_brand,
          ut.name as trip_name
        FROM gear_reviews gr
        JOIN gear_catalog gc ON gr.gear_id = gc.id
        LEFT JOIN user_trips ut ON gr.trip_id = ut.id
        WHERE gr.user_id = ${userResult[0].id}
        ORDER BY gr.created_at DESC
      `;

      return NextResponse.json({ reviews });
    }

    if (gearId) {
      // Get all reviews for a specific gear item
      const reviews = await sql`
        SELECT
          gr.id,
          gr.rating,
          gr.title,
          gr.review,
          gr.conditions,
          gr.created_at,
          u.name as user_name,
          ut.name as trip_name,
          ut.region as trip_region
        FROM gear_reviews gr
        JOIN users u ON gr.user_id = u.id
        LEFT JOIN user_trips ut ON gr.trip_id = ut.id
        WHERE gr.gear_id = ${gearId}
        ORDER BY gr.created_at DESC
      `;

      // Get aggregate stats
      const stats = await sql`
        SELECT
          COUNT(*) as review_count,
          ROUND(AVG(rating)::numeric, 1) as avg_rating
        FROM gear_reviews
        WHERE gear_id = ${gearId}
      `;

      return NextResponse.json({
        reviews,
        stats: stats[0] || { review_count: 0, avg_rating: null }
      });
    }

    return NextResponse.json({ error: 'gearId or userOnly required' }, { status: 400 });
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// POST - create or update a review
export async function POST(request: Request) {
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

    const { gearId, rating, title, review, conditions, tripId } = await request.json();

    if (!gearId || !rating) {
      return NextResponse.json({ error: 'gearId and rating required' }, { status: 400 });
    }

    if (rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be 1-5' }, { status: 400 });
    }

    // Verify user owns this gear
    const ownsGear = await sql`
      SELECT 1 FROM user_gear ug
      JOIN gear_catalog gc ON ug.gear_id = gc.id
      WHERE ug.user_id = ${userId} AND gc.id = ${gearId}
    `;

    if (!ownsGear[0]) {
      return NextResponse.json({ error: 'You can only review gear you own' }, { status: 403 });
    }

    // Upsert review
    const result = await sql`
      INSERT INTO gear_reviews (user_id, gear_id, trip_id, rating, title, review, conditions)
      VALUES (${userId}, ${gearId}, ${tripId || null}, ${rating}, ${title || null}, ${review || null}, ${conditions || null})
      ON CONFLICT (user_id, gear_id)
      DO UPDATE SET
        rating = ${rating},
        title = ${title || null},
        review = ${review || null},
        conditions = ${conditions || null},
        trip_id = ${tripId || null},
        updated_at = NOW()
      RETURNING id
    `;

    return NextResponse.json({ success: true, reviewId: result[0].id });
  } catch (error) {
    console.error('Error saving review:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE - remove a review
export async function DELETE(request: Request) {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reviewId = searchParams.get('id');

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID required' }, { status: 400 });
    }

    const userResult = await sql`SELECT id FROM users WHERE email = ${session.user.email}`;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await sql`
      DELETE FROM gear_reviews
      WHERE id = ${reviewId} AND user_id = ${userResult[0].id}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
