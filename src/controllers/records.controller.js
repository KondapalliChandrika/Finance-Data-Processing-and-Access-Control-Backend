const { validationResult } = require('express-validator');
const pool = require('../config/db');

function validationCheck(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.status(422).json({ success: false, message: 'Validation failed', errors: errors.array() });
        return false;
    }
    return true;
}

// POST /api/records
async function createRecord(req, res, next) {
    if (!validationCheck(req, res)) return;
    const { amount, type, category, date, notes } = req.body;
    try {
        const { rows } = await pool.query(
            `INSERT INTO financial_records (amount, type, category, date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
            [amount, type, category, date, notes || null, req.user.id]
        );
        res.status(201).json({ success: true, message: 'Record created successfully.', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// GET /api/records
async function listRecords(req, res, next) {
    try {
        const { type, category, from, to, page = 1, limit = 20 } = req.query;
        const conditions = ['is_deleted = FALSE'];
        const values = [];

        if (type) { values.push(type); conditions.push(`type = $${values.length}`); }
        if (category) { values.push(category); conditions.push(`category ILIKE $${values.length}`); }
        if (from) { values.push(from); conditions.push(`date >= $${values.length}`); }
        if (to) { values.push(to); conditions.push(`date <= $${values.length}`); }

        const where = `WHERE ${conditions.join(' AND ')}`;
        const offset = (parseInt(page) - 1) * parseInt(limit);
        const countRes = await pool.query(`SELECT COUNT(*) FROM financial_records ${where}`, values);
        const total = parseInt(countRes.rows[0].count);

        values.push(parseInt(limit), offset);
        const { rows } = await pool.query(
            `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       LEFT JOIN users u ON u.id = r.created_by
       ${where}
       ORDER BY r.date DESC, r.created_at DESC
       LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );

        res.json({ success: true, data: rows, meta: { total, page: +page, limit: +limit } });
    } catch (err) {
        next(err);
    }
}

// GET /api/records/:id
async function getRecord(req, res, next) {
    try {
        const { rows } = await pool.query(
            `SELECT r.*, u.name AS created_by_name
       FROM financial_records r
       LEFT JOIN users u ON u.id = r.created_by
       WHERE r.id = $1 AND r.is_deleted = FALSE`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// PUT /api/records/:id
async function updateRecord(req, res, next) {
    if (!validationCheck(req, res)) return;
    const { amount, type, category, date, notes } = req.body;
    try {
        const fields = [];
        const values = [];
        if (amount !== undefined) { values.push(amount); fields.push(`amount = $${values.length}`); }
        if (type) { values.push(type); fields.push(`type = $${values.length}`); }
        if (category) { values.push(category); fields.push(`category = $${values.length}`); }
        if (date) { values.push(date); fields.push(`date = $${values.length}`); }
        if (notes !== undefined) { values.push(notes); fields.push(`notes = $${values.length}`); }

        if (!fields.length) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        fields.push(`updated_at = NOW()`);
        values.push(req.params.id);

        const { rows } = await pool.query(
            `UPDATE financial_records SET ${fields.join(', ')}
       WHERE id = $${values.length} AND is_deleted = FALSE
       RETURNING *`,
            values
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, message: 'Record updated successfully.', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/records/:id  (soft delete)
async function deleteRecord(req, res, next) {
    try {
        const { rows } = await pool.query(
            `UPDATE financial_records SET is_deleted = TRUE, updated_at = NOW()
       WHERE id = $1 AND is_deleted = FALSE
       RETURNING id`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'Record not found.' });
        res.json({ success: true, message: 'Record deleted successfully.' });
    } catch (err) {
        next(err);
    }
}

module.exports = { createRecord, listRecords, getRecord, updateRecord, deleteRecord };
