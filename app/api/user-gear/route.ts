// app/api/user-gear/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

// Dynamic import auth to avoid module init issues
async function getAuth() {
  const { auth } = await import('@/lib/auth');
  return auth;
}

// GET - fetch user's gear portfolio
export async function GET() {
  try {
    const auth = await getAuth();
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ gear: [] });
    }

    // Get user ID
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ gear: [] });
    }
    const userId = userResult[0].id;

    // Get user's gear with catalog info
    const gear = await sql`
      SELECT
        ug.id,
        ug.notes,
        ug.category as user_category,
        ug.created_at as added_at,
        gc.name,
        gc.manufacturer as brand,
        gc.category as catalog_category,
        gc.specs
      FROM user_gear ug
      JOIN gear_catalog gc ON ug.gear_id = gc.id
      WHERE ug.user_id = ${userId}
      ORDER BY ug.created_at DESC
    `;

    return NextResponse.json({
      gear: gear.map((g: any) => ({
        id: g.id,
        name: g.name,
        brand: g.brand,
        category: g.user_category || g.catalog_category || 'other',
        specs: formatSpecs(g.specs),
        notes: g.notes,
        addedAt: g.added_at,
      })),
    });
  } catch (error) {
    console.error('Error fetching user gear:', error);
    return NextResponse.json({ gear: [], error: String(error) });
  }
}

// POST - add gear to user's portfolio
export async function POST(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, brand, specs, category, subcategory, gender, notes } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category required' }, { status: 400 });
    }

    // Get or create user
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userResult[0].id;

    // Find or create gear in catalog
    let gearResult = await sql`
      SELECT id FROM gear_catalog WHERE name = ${name} LIMIT 1
    `;

    let gearId;
    if (gearResult[0]) {
      gearId = gearResult[0].id;
    } else {
      // Add to catalog
      const newGear = await sql`
        INSERT INTO gear_catalog (name, manufacturer, category, specs)
        VALUES (${name}, ${brand}, ${category}, ${JSON.stringify({ raw: specs })})
        RETURNING id
      `;
      gearId = newGear[0].id;
    }

    // Add to user's gear
    await sql`
      INSERT INTO user_gear (user_id, gear_id, category, subcategory, gender, notes)
      VALUES (${userId}, ${gearId}, ${category}, ${subcategory || null}, ${gender || null}, ${notes || null})
      ON CONFLICT DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error adding user gear:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

// DELETE - remove gear from portfolio
export async function DELETE(request: Request) {
  try {
    const auth = await getAuth();
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 });
    }

    // Get user
    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userResult[0].id;

    // Delete (only if owned by user)
    await sql`
      DELETE FROM user_gear
      WHERE id = ${id} AND user_id = ${userId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting user gear:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

function formatSpecs(specs: any): string {
  if (!specs) return '';
  if (typeof specs === 'string') return specs;
  if (specs.raw) return specs.raw;

  const parts = [];
  if (specs.weight?.value) parts.push(`${specs.weight.value}${specs.weight.unit || 'g'}`);
  if (specs.waterproofing) parts.push(specs.waterproofing);
  if (specs.warmth) parts.push(specs.warmth);
  if (specs.material) parts.push(specs.material);

  return parts.join(', ') || JSON.stringify(specs).slice(0, 100);
}
