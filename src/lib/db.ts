import 'server-only';
import { Pool, types, type PoolClient } from 'pg';

// Return values the way the pages expect them: numbers as numbers, dates and
// timestamps as ISO strings (not JS Date objects, which shift with timezones).
types.setTypeParser(types.builtins.NUMERIC, (v) => parseFloat(v));
types.setTypeParser(types.builtins.INT8, (v) => parseInt(v, 10));
types.setTypeParser(types.builtins.DATE, (v) => v);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (v) => new Date(v).toISOString());
types.setTypeParser(types.builtins.TIMESTAMP, (v) => v);

export const configured = !!process.env.DATABASE_URL;

// One pool per server instance. In dev, Next re-evaluates modules on every
// edit, so keep it on globalThis to avoid leaking connections.
const g = globalThis as unknown as { __pool?: Pool };
function pool() {
  if (!configured) throw new Error('DATABASE_URL is not set');
  g.__pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 5 });
  return g.__pool;
}

export type Db = {
  /** All rows. */
  all: <T = any>(sql: string, params?: unknown[]) => Promise<T[]>;
  /** First row, or null. */
  one: <T = any>(sql: string, params?: unknown[]) => Promise<T | null>;
};

function wrap(client: PoolClient): Db {
  return {
    all: async (sql, params) => (await client.query(sql, params)).rows,
    one: async (sql, params) => (await client.query(sql, params)).rows[0] ?? null,
  };
}

async function transaction<T>(setup: string[], fn: (db: Db) => Promise<T>): Promise<T> {
  const client = await pool().connect();
  try {
    await client.query('begin');
    for (const s of setup) await client.query(s);
    const result = await fn(wrap(client));
    await client.query('commit');
    return result;
  } catch (e) {
    await client.query('rollback').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

/**
 * Runs `fn` in a transaction as the restricted `ledger_app` role, with the
 * organization pinned. Row-level security then limits every statement to
 * that organization's rows — a query that forgets a WHERE clause still
 * cannot see another company's data.
 */
export function withOrg<T>(orgId: string, fn: (db: Db) => Promise<T>): Promise<T> {
  return transaction([], async (db) => {
    await db.all(`select set_config('app.org_id', $1, true)`, [orgId]);
    await db.all('set local role ledger_app');
    return fn(db);
  });
}

/** Unscoped transaction as the owner role. Only for sign-in and sign-up. */
export function asOwner<T>(fn: (db: Db) => Promise<T>): Promise<T> {
  return transaction([], fn);
}
