// app/api/gear/route.ts

import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { readFileSync } from 'fs';
import { join } from 'path';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function loadSkill(): string {
  try {
    return readFileSync(join(process.cwd(), 'skills', 'gear-search', 'SKILL.md'), 'utf-8');
  } catch {
    return '';
  }
}

async function enrichItem(sql: any, id: string, name: string) {
  console.log('[ENRICH] Starting for:', name, 'ID:', id);
  try {
    const skill = loadSkill();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: skill },
        { role: 'user', content: `Query: "${name}"\n\nFind this exact product with image and reviews.` }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content || '';
    const parsed = JSON.parse(content);
    const item = parsed.results?.[0] || parsed;

    console.log('[ENRICH] Got imageUrl:', item.imageUrl || 'NONE');
    console.log('[ENRICH] Got reviews:', item.reviews ? 'YES' : 'NONE');

    if (item.imageUrl || item.reviews) {
      await sql`
        UPDATE gear_catalog SET
          image_url = COALESCE(${item.imageUrl || null}, image_url),
          reviews = COALESCE(${item.reviews ? JSON.stringify(item.reviews) : null}::jsonb, reviews),
          description = COALESCE(${item.description || null}, description),
          product_url = COALESCE(${item.productUrl || null}, product_url)
        WHERE id = ${id}
      `;
      console.log('[ENRICH] Updated DB for:', name);
    }
  } catch (error) {
    console.error('[ENRICH] Failed:', name, error);
  }
}

// Dynamic imports to avoid module init issues
async function getDb() {
  const { sql } = await import('@/lib/db');
  return sql;
}

async function getAuth() {
  const { auth } = await import('@/lib/auth');
  return auth;
}

// GET - fetch user's gear portfolio
export async function GET() {
  try {
    const sql = await getDb();
    const auth = await getAuth();
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json({ gear: [] });
    }

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ gear: [] });
    }
    const userId = userResult[0].id;

    const gear = await sql`
      SELECT
        ug.id,
        ug.notes,
        ug.category as user_category,
        ug.subcategory as user_subcategory,
        ug.gender as user_gender,
        ug.created_at as added_at,
        gc.name,
        gc.manufacturer as brand,
        gc.category as catalog_category,
        gc.subcategory as catalog_subcategory,
        gc.gender as catalog_gender,
        gc.image_url,
        gc.description,
        gc.product_url,
        gc.reviews,
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
        subcategory: g.user_subcategory || g.catalog_subcategory,
        gender: g.user_gender || g.catalog_gender,
        imageUrl: g.image_url,
        description: g.description,
        productUrl: g.product_url,
        reviews: g.reviews,
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
    const sql = await getDb();
    let userId: string | null = null;

    try {
      const auth = await getAuth();
      const session = await auth();
      if (session?.user?.email) {
        let userResult = await sql`
          SELECT id FROM users WHERE email = ${session.user.email}
        `;

        // Auto-create user if they don't exist
        if (!userResult[0]) {
          userResult = await sql`
            INSERT INTO users (email, name, image, created_at)
            VALUES (${session.user.email}, ${session.user.name || 'User'}, ${session.user.image || null}, NOW())
            RETURNING id
          `;
        }

        if (userResult[0]) {
          userId = userResult[0].id;
        }
      }
    } catch (authError) {
      console.error('Auth error:', authError);
    }

    if (!userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, brand, specs, category, subcategory, gender, notes, imageUrl, description, productUrl, reviews } = await request.json();

    if (!name || !category) {
      return NextResponse.json({ error: 'Name and category required' }, { status: 400 });
    }

    // Find or create gear in catalog
    let gearResult = await sql`
      SELECT id FROM gear_catalog WHERE name = ${name} LIMIT 1
    `;

    let gearId;
    if (gearResult[0]) {
      gearId = gearResult[0].id;
      // Update with new data if we have it
      await sql`
        UPDATE gear_catalog SET
          image_url = COALESCE(${imageUrl || null}, image_url),
          subcategory = COALESCE(${subcategory || null}, subcategory),
          gender = COALESCE(${gender || null}, gender),
          description = COALESCE(${description || null}, description),
          product_url = COALESCE(${productUrl || null}, product_url),
          reviews = COALESCE(${reviews ? JSON.stringify(reviews) : null}::jsonb, reviews)
        WHERE id = ${gearId}
      `;
      // Check if still incomplete - enrich if missing image or reviews
      const checkResult = await sql`
        SELECT image_url, reviews FROM gear_catalog WHERE id = ${gearId}
      `;
      if (!checkResult[0]?.image_url || !checkResult[0]?.reviews) {
        console.log('[GEAR POST] Item incomplete, enriching:', name);
        await enrichItem(sql, gearId, name);
      }
    } else {
      const newGear = await sql`
        INSERT INTO gear_catalog (name, manufacturer, category, subcategory, gender, image_url, description, product_url, reviews, specs)
        VALUES (${name}, ${brand}, ${category}, ${subcategory || null}, ${gender || null}, ${imageUrl || null}, ${description || null}, ${productUrl || null}, ${reviews ? JSON.stringify(reviews) : null}::jsonb, ${JSON.stringify({ raw: specs })})
        RETURNING id
      `;
      gearId = newGear[0].id;
      // Enrich new items if no image or reviews provided
      if (!imageUrl || !reviews) {
        console.log('[GEAR POST] New item, enriching:', name);
        await enrichItem(sql, gearId, name);
      }
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
    const sql = await getDb();
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

    const userResult = await sql`
      SELECT id FROM users WHERE email = ${session.user.email}
    `;
    if (!userResult[0]) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    const userId = userResult[0].id;

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
