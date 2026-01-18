// app/api/gear/weight/route.ts
// Update gear weight in catalog (user correction)

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { sql } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gearCatalogId, weightG } = await request.json();

    if (!gearCatalogId || typeof weightG !== 'number') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Update the gear catalog with user-provided weight
    // Mark as not estimated since user provided it
    await sql`
      UPDATE gear_catalog
      SET weight_g = ${weightG}, weight_estimated = false
      WHERE id = ${gearCatalogId}
    `;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Weight update error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
