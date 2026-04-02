const { Pool, Client } = require('pg');

// Parse the target database name from DATABASE_URL
const dbUrl = new URL(process.env.DATABASE_URL);
const targetDb = dbUrl.pathname.replace(/^\//, ''); // e.g. "finance_db"

/**
 * Step 1 — Ensure the target database exists.
 * Connects to the default "postgres" maintenance DB, checks if the target DB
 * is listed in pg_database, and creates it only if it does not exist.
 * If the DB already exists this is a no-op (skipped).
 */
async function ensureDatabase() {
  // Build a connection string pointing at the default "postgres" DB
  const maintenanceUrl = new URL(process.env.DATABASE_URL);
  maintenanceUrl.pathname = '/postgres';

  const adminClient = new Client({ connectionString: maintenanceUrl.toString() });
  await adminClient.connect();

  try {
    const { rows } = await adminClient.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [targetDb]
    );

    if (rows.length === 0) {
      // Database does not exist — create it
      await adminClient.query(`CREATE DATABASE "${targetDb}"`);
      console.log(`✅ Database "${targetDb}" created`);
    } else {
      console.log(`ℹ️  Database "${targetDb}" already exists — skipping creation`);
    }
  } finally {
    await adminClient.end();
  }
}

/**
 * Step 2 — Ensure the required tables exist inside the target database.
 * Uses CREATE TABLE IF NOT EXISTS — completely safe to call on every startup.
 * If the tables already exist, PostgreSQL skips them silently.
 */
async function ensureTables(pool) {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id            SERIAL PRIMARY KEY,
        name          VARCHAR(100) NOT NULL,
        email         VARCHAR(150) UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role          VARCHAR(20) NOT NULL DEFAULT 'viewer'
                      CHECK (role IN ('viewer','analyst','admin')),
        status        VARCHAR(20) NOT NULL DEFAULT 'active'
                      CHECK (status IN ('active','inactive')),
        created_at    TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS financial_records (
        id          SERIAL PRIMARY KEY,
        amount      NUMERIC(15,2) NOT NULL CHECK (amount > 0),
        type        VARCHAR(20) NOT NULL CHECK (type IN ('income','expense')),
        category    VARCHAR(100) NOT NULL,
        date        DATE NOT NULL,
        notes       TEXT,
        created_by  INTEGER REFERENCES users(id) ON DELETE SET NULL,
        is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
        created_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at  TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Tables ready (created or already existed)');
  } finally {
    client.release();
  }
}

/**
 * Bootstrap sequence:
 *  1. Connect to "postgres" DB → create target DB if missing
 *  2. Create pool to target DB
 *  3. Create tables if missing
 */
async function bootstrap() {
  await ensureDatabase();

  // Now build the real pool targeting the application database
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  await ensureTables(pool);
  return pool;
}

// Export a lazy-initialized pool promise so all controllers can await it
let _pool = null;

async function getPool() {
  if (!_pool) {
    _pool = await bootstrap();
  }
  return _pool;
}

// Run bootstrap immediately on require so the server is ready on first request
const poolReady = bootstrap()
  .then((pool) => {
    _pool = pool;
    return pool;
  })
  .catch((err) => {
    console.error('❌ Failed to initialise database:', err.message);
    process.exit(1);
  });

// Export a proxy that transparently awaits the pool on first use
module.exports = {
  query: async (...args) => {
    const pool = _pool || (await poolReady);
    return pool.query(...args);
  },
  connect: async () => {
    const pool = _pool || (await poolReady);
    return pool.connect();
  },
  getPool,
};
