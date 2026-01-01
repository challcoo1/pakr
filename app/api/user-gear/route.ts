// app/api/user-gear/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET() {
  try {
    // Get user's gear with full specs from gear_catalog
    // For now, no auth - get all user_gear joined with catalog
    const gear = await sql`
      SELECT
        ug.id,
        gc.name,
        gc.manufacturer,
        gc.category,
        gc.specs
      FROM user_gear ug
      JOIN gear_catalog gc ON ug.gear_id = gc.id
      ORDER BY gc.category, gc.name
    `;

    return NextResponse.json({ gear });
  } catch (error) {
    console.error('Error fetching user gear:', error);
    return NextResponse.json({ gear: [], error: 'Failed to fetch gear' }, { status: 500 });
  }
}
