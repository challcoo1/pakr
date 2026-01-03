require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.POSTGRES_URL);

sql`SELECT name, image_url, reviews IS NOT NULL as has_reviews FROM gear_catalog WHERE name ILIKE '%norvan%'`
  .then(r => console.log(JSON.stringify(r, null, 2)))
  .catch(console.error);
