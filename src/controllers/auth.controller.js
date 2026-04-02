const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
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

// POST /api/auth/register
async function register(req, res, next) {
    if (!validationCheck(req, res)) return;
    const { name, email, password } = req.body;
    try {
        const password_hash = await bcrypt.hash(password, 10);
        const { rows } = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, status)
       VALUES ($1, $2, $3, 'viewer', 'active')
       RETURNING id, name, email, role, status, created_at`,
            [name, email, password_hash]
        );
        res.status(201).json({ success: true, message: 'User registered successfully', data: rows[0] });
    } catch (err) {
        next(err);
    }
}

// POST /api/auth/login
async function login(req, res, next) {
    if (!validationCheck(req, res)) return;
    const { email, password } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = rows[0];
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }
        if (user.status === 'inactive') {
            return res.status(403).json({ success: false, message: 'Account is inactive. Contact an admin.' });
        }

        const valid = await bcrypt.compare(password, user.password_hash);
        if (!valid) {
            return res.status(401).json({ success: false, message: 'Invalid email or password.' });
        }

        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } },
        });
    } catch (err) {
        next(err);
    }
}

// GET /api/auth/me
async function me(req, res, next) {
    try {
        const { rows } = await pool.query(
            'SELECT id, name, email, role, status, created_at FROM users WHERE id = $1',
            [req.user.id]
        );
        if (!rows[0]) return res.status(404).json({ success: false, message: 'User not found.' });
        res.json({ success: true, data: rows[0] });
    } catch (err) {
        next(err);
    }
}

module.exports = { register, login, me };
