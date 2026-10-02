// Applies db/schema.sql to the database in DATABASE_URL.
// Usage: npm run db:setup   (reads .env.local if DATABASE_URL isn't already set)
import { readFileSync, existsSync } from 'node:fs';
import pg from 'pg';

if (!process.env.DATABASE_URL && existsSync('.env.local')) {
  for (const line of readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Add it to .env.local first (see SETUP.md).');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
try {
  await client.connect();
  await client.query(readFileSync(new URL('../db/schema.sql', import.meta.url), 'utf8'));
  console.log('Schema applied. You can now run: npm run dev');
} catch (e) {
  console.error('Schema failed:', e.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
