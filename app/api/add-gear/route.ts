// app/api/add-gear/route.ts

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { name, brand, specs, category } = await request.json();

    if (!name) {
      return NextResponse.json({ error: 'Name required' }, { status: 400 });
    }

    // Check if already exists
    const existing = await sql`
      SELECT id FROM gear_catalog
      WHERE LOWER(name) = ${name.toLowerCase()}
      LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json({ id: existing[0].id, exists: true });
    }

    // Insert new gear
    const result = await sql`
      INSERT INTO gear_catalog (name, manufacturer, category, specs)
      VALUES (${name}, ${brand || null}, ${category || null}, ${specs ? JSON.stringify(specs) : null})
      RETURNING id
    `;

    return NextResponse.json({ id: result[0].id, exists: false });

  } catch (error) {
    console.error('Add gear error:', error);
    return NextResponse.json({ error: 'Failed to add gear' }, { status: 500 });
  }
}
