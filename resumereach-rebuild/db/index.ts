import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export const db = drizzle(pool, { schema });

export default db;

// Health check
export async function checkHealth() {
  try {
    await pool.query('SELECT NOW()');
    return { status: 'healthy' };
  } catch (error) {
    return { status: 'unhealthy', error: String(error) };
  }
}
