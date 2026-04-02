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

// GET /api/users
async function listUsers(req, res, next) {
    try {
        const { status, role, page = 1, limit = 20 } = req.query;
        const conditions = [];
        const values = [];

        if (status) { values.push(status); conditions.push(`status = $${values.length}`); }
        if (role) { values.push(role); conditions.push(`role = $${values.length}`); }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
        const offset = (parseInt(page) - 1) * parseInt(limit);
        values.push(parseInt(limit), offset);

        const { rows } = await pool.query(
            `SELECT id, name, email, role, status, created_at FROM users
       ${where} ORDER BY created_at DESC LIMIT $${values.length - 1} OFFSET $${values.length}`,
            values
        );

        const countRes = await pool.query(`SELECT COUNT(*) FROM users ${where}`, values.slice(0, -2));
        const total = parseInt(countRes.rows[0].count);

        res.json({ success: true, data: rows, meta: { total, page: +page, limit: +limit } });
    } catch (err) {
        next(err);
    }
}

// GET /api/users/:id
async function getUser(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, role, status, created_at FROM users WHERE id = $1',
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// PUT /api/users/:id
async function updateUser(req, res, next) {
    if (!validationCheck(req, res)) return;
    const { name, role, status } = req.body;
    try {
        // Prevent admin from deactivating/demoting themselves
        if (req.params.id == req.user.id && (role || status === 'inactive')) {
            return res.status(400).json({ success: false, message: 'Admins cannot change their own role or deactivate themselves.' });
        }

        const fields = [];
        const values = [];
        if (name) { values.push(name); fields.push(`name = $${values.length}`); }
        if (role) { values.push(role); fields.push(`role = $${values.length}`); }
        if (status) { values.push(status); fields.push(`status = $${values.length}`); }

        if (!fields.length) {
            return res.status(400).json({ success: false, message: 'No fields provided to update.' });
        }

        values.push(req.params.id);
        const { rows } = await pool.query(
            `UPDATE users SET ${fields.join(', ')} WHERE id = $${values.length}
       RETURNING id, name, email, role, status, created_at`,
            values
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, message: 'User updated successfully.', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// DELETE /api/users/:id  (soft delete — sets status to inactive)
async function deleteUser(req, res, next) {
    try {
        if (req.params.id == req.user.id) {
            return res.status(400).json({ success: false, message: 'Admins cannot deactivate their own account.' });
        }
        const { rows } = await pool.query(
            `UPDATE users SET status = 'inactive' WHERE id = $1
       RETURNING id, name, email, status`,
            [req.params.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, message: 'User deactivated successfully.', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = { listUsers, getUser, updateUser, deleteUser };
