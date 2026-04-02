const express = require('express');
const router = express.Router();
const { getSummary, getByCategory, getTrends, getRecentActivity } = require('../controllers/dashboard.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard analytics and summary endpoints
 */

/**
 * @swagger
 * /api/dashboard/summary:
 *   get:
 *     summary: Get overall financial summary (total income, expenses, net balance)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Financial summary totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_income:
 *                       type: number
 *                       example: 85000.00
 *                     total_expenses:
 *                       type: number
 *                       example: 42000.00
 *                     net_balance:
 *                       type: number
 *                       example: 43000.00
 *                     total_records:
 *                       type: integer
 *                       example: 30
 */
router.get('/summary', verifyToken, getSummary);

/**
 * @swagger
 * /api/dashboard/by-category:
 *   get:
 *     summary: Get totals grouped by category
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter to only income or expense categories
 *     responses:
 *       200:
 *         description: Category-wise totals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       category:
 *                         type: string
 *                       type:
 *                         type: string
 *                       total:
 *                         type: number
 *                       count:
 *                         type: integer
 */
router.get('/by-category', verifyToken, getByCategory);

/**
 * @swagger
 * /api/dashboard/trends:
 *   get:
 *     summary: Monthly income vs expense trends for the last 12 months (Analyst & Admin only)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Monthly trend data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       month:
 *                         type: string
 *                         example: "2024-03"
 *                       income:
 *                         type: number
 *                       expenses:
 *                         type: number
 *                       net:
 *                         type: number
 *       403:
 *         description: Forbidden — Viewer cannot access trends
 */
router.get('/trends', verifyToken, getTrends);

/**
 * @swagger
 * /api/dashboard/recent:
 *   get:
 *     summary: Get recent financial activity (last 10 records)
 *     tags: [Dashboard]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 50
 *         description: Number of recent records to return (max 50)
 *     responses:
 *       200:
 *         description: Recent activity
 */
router.get('/recent', verifyToken, getRecentActivity);

module.exports = router;
