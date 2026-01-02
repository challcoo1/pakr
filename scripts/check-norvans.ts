import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const sql = neon(process.env.POSTGRES_URL!);

async function check() {
  const results = await sql`
    SELECT name FROM gear_catalog
    WHERE LOWER(name) LIKE '%rain%' OR LOWER(name) LIKE '%jacket%'
    LIMIT 10
  `;
  console.log('Rain/jacket entries in DB:');
  results.forEach((r: any) => console.log('-', r.name));
}

check();
