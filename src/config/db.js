const { Pool } = require('pg');

/**
 * Step — Ensure required tables exist
 * Safe to run every time (uses CREATE IF NOT EXISTS)
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
 * Bootstrap — connect to DB + ensure tables
 */
async function bootstrap() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false, // REQUIRED for Render
    },
  });

  await ensureTables(pool);
  return pool;
}

// Lazy pool initialization
let _pool = null;

async function getPool() {
  if (!_pool) {
    _pool = await bootstrap();
  }
  return _pool;
}

// Initialize immediately
const poolReady = bootstrap()
  .then((pool) => {
    _pool = pool;
    return pool;
  })
  .catch((err) => {
    console.error('❌ Failed to initialise database:', err.message);
    process.exit(1);
  });

// Export helper methods
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
