require('dotenv').config();
const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function seed() {
    console.log('🌱 Seeding database...');
    const client = await pool.connect();

    try {
        // ── Create tables (same as db.js) ──────────────────────────────
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

        // ── Users ──────────────────────────────────────────────────────
        const password = await bcrypt.hash('Password123!', 10);
        const seedUsers = [
            { name: 'Admin User', email: 'admin@finance.dev', role: 'admin' },
            { name: 'Analyst User', email: 'analyst@finance.dev', role: 'analyst' },
            { name: 'Viewer User', email: 'viewer@finance.dev', role: 'viewer' },
        ];

        const userIds = {};
        for (const u of seedUsers) {
            const res = await client.query(
                `INSERT INTO users (name, email, password_hash, role)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, role = EXCLUDED.role
         RETURNING id, role`,
                [u.name, u.email, password, u.role]
            );
            userIds[u.role] = res.rows[0].id;
            console.log(`  ✅ User: ${u.email} [${u.role}]`);
        }

        // ── Financial Records ──────────────────────────────────────────
        const categories = {
            income: ['salary', 'freelance', 'investment', 'rental', 'bonus'],
            expense: ['rent', 'food', 'utilities', 'transport', 'healthcare', 'entertainment', 'education'],
        };

        const records = [];
        const now = new Date('2026-04-02');

        for (let m = 0; m < 12; m++) {
            const date = new Date(now);
            date.setMonth(date.getMonth() - m);

            // 2-3 income records per month
            const incomeCats = categories.income;
            records.push({
                amount: (Math.random() * 30000 + 20000).toFixed(2),
                type: 'income', category: incomeCats[0],
                date: formatDate(date, 1), notes: 'Monthly salary', created_by: userIds.admin,
            });
            records.push({
                amount: (Math.random() * 8000 + 2000).toFixed(2),
                type: 'income', category: incomeCats[Math.floor(Math.random() * 3) + 1],
                date: formatDate(date, 10), notes: 'Side income', created_by: userIds.analyst,
            });

            // 4-5 expense records per month
            const expCats = categories.expense;
            for (let i = 0; i < 5; i++) {
                records.push({
                    amount: (Math.random() * 5000 + 500).toFixed(2),
                    type: 'expense', category: expCats[i % expCats.length],
                    date: formatDate(date, 5 + i * 4), notes: null, created_by: userIds.analyst,
                });
            }
        }

        // Clear existing records and re-insert
        await client.query('DELETE FROM financial_records');
        for (const r of records) {
            await client.query(
                `INSERT INTO financial_records (amount, type, category, date, notes, created_by)
         VALUES ($1, $2, $3, $4, $5, $6)`,
                [r.amount, r.type, r.category, r.date, r.notes, r.created_by]
            );
        }

        console.log(`  ✅ Inserted ${records.length} financial records`);
        console.log('\n🎉 Seed complete!');
        console.log('\nDemo credentials (password: Password123!):');
        console.log('  admin@finance.dev    → admin');
        console.log('  analyst@finance.dev  → analyst');
        console.log('  viewer@finance.dev   → viewer');
    } finally {
        client.release();
        await pool.end();
    }
}

function formatDate(base, dayOffset) {
    const d = new Date(base);
    d.setDate(dayOffset);
    return d.toISOString().split('T')[0];
}

seed().catch((err) => {
    console.error('❌ Seed failed:', err.message);
    process.exit(1);
});
