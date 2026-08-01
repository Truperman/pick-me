import { Pool } from "pg";

// Single shared connection pool for the app. In dev with Next.js hot-reload
// we stash it on globalThis to avoid exhausting Postgres connections.
declare global {
  // eslint-disable-next-line no-var
  var __bizdnaPool: Pool | undefined;
}

export const pool =
  global.__bizdnaPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 10,
  });

if (process.env.NODE_ENV !== "production") {
  global.__bizdnaPool = pool;
}

export async function query<T = any>(text: string, params: any[] = []): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params: any[] = []): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] ?? null;
}
