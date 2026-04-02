const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

// Route imports
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const recordsRoutes = require('./routes/records.routes');
const dashboardRoutes = require('./routes/dashboard.routes');

const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── Global Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── API Routes ─────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/dashboard', dashboardRoutes);

// ── Swagger UI ─────────────────────────────────────────────────────
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    customSiteTitle: 'Finance API Docs',
    swaggerOptions: { persistAuthorization: true },
}));

// ── Root Welcome ───────────────────────────────────────────────────
app.get('/', (_req, res) => {
    res.json({
        success: true,
        message: 'Welcome to the Finance Data Processing & Access Control API',
        version: '1.0.0',
        docs: 'http://localhost:3000/api-docs',
        health: 'http://localhost:3000/health',
        endpoints: {
            auth: '/api/auth',
            users: '/api/users',
            records: '/api/records',
            dashboard: '/api/dashboard',
        },
    });
});

// ── Health Check ───────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// ── 404 Handler ────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// ── Global Error Handler ───────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
