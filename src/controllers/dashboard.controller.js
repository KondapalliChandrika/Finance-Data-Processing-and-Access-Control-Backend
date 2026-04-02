const pool = require('../config/db');

// GET /api/dashboard/summary
async function getSummary(req, res, next) {
    try {
        const { rows } = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0) AS total_income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expenses,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount ELSE 0 END), 0) AS net_balance,
        COUNT(*) AS total_records
      FROM financial_records
      WHERE is_deleted = FALSE
    `);
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/dashboard/by-category
async function getByCategory(req, res, next) {
    try {
        const { type } = req.query; // optional filter
        const conditions = ['is_deleted = FALSE'];
        const values = [];
        if (type) { values.push(type); conditions.push(`type = $${values.length}`); }

        const { rows } = await pool.query(`
      SELECT
        category,
        type,
        COALESCE(SUM(amount), 0)  AS total,
        COUNT(*)                  AS count
      FROM financial_records
      WHERE ${conditions.join(' AND ')}
      GROUP BY category, type
      ORDER BY total DESC
    `, values);

        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

// GET /api/dashboard/trends  (monthly income vs expense for last 12 months)
async function getTrends(req, res, next) {
    try {
        const { rows } = await pool.query(`
      SELECT
        TO_CHAR(date, 'YYYY-MM')                                               AS month,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END), 0)   AS income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0)   AS expenses,
        COALESCE(SUM(CASE WHEN type = 'income'  THEN amount
                          WHEN type = 'expense' THEN -amount END), 0)          AS net
      FROM financial_records
      WHERE is_deleted = FALSE
        AND date >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(date, 'YYYY-MM')
      ORDER BY month ASC
    `);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

// GET /api/dashboard/recent
async function getRecentActivity(req, res, next) {
    try {
        const limit = Math.min(parseInt(req.query.limit) || 10, 50);
        const { rows } = await pool.query(`
      SELECT r.id, r.amount, r.type, r.category, r.date, r.notes, u.name AS created_by_name
      FROM financial_records r
      LEFT JOIN users u ON u.id = r.created_by
      WHERE r.is_deleted = FALSE
      ORDER BY r.date DESC, r.created_at DESC
      LIMIT $1
    `, [limit]);
        res.json({ success: true, data: rows });
    } catch (err) {
        next(err);
    }
}

module.exports = { getSummary, getByCategory, getTrends, getRecentActivity };
