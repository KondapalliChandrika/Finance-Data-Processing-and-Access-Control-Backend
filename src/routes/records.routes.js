const express = require('express');
const router = express.Router();
const {
    createRecord, listRecords, getRecord, updateRecord, deleteRecord,
} = require('../controllers/records.controller');
const { verifyToken } = require('../middleware/auth');
const { requireRole } = require('../middleware/roles');
const { createRecordValidator, updateRecordValidator } = require('../validators/records.validator');

/**
 * @swagger
 * tags:
 *   name: Records
 *   description: Financial records management
 */

/**
 * @swagger
 * /api/records:
 *   post:
 *     summary: Create a new financial record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, type, category, date]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 5000.00
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *                 example: income
 *               category:
 *                 type: string
 *                 example: salary
 *               date:
 *                 type: string
 *                 format: date
 *                 example: "2024-03-15"
 *               notes:
 *                 type: string
 *                 example: March salary
 *     responses:
 *       201:
 *         description: Record created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialRecord'
 *       403:
 *         description: Forbidden — Viewer cannot create records
 *       422:
 *         description: Validation error
 */
router.post('/', verifyToken, requireRole('admin', 'analyst'), createRecordValidator, createRecord);

/**
 * @swagger
 * /api/records:
 *   get:
 *     summary: List financial records with optional filters and pagination
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [income, expense]
 *         description: Filter by record type
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category (case-insensitive partial match)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date (YYYY-MM-DD)
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date
 *         description: End date (YYYY-MM-DD)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *     responses:
 *       200:
 *         description: Paginated list of financial records
 *       403:
 *         description: Forbidden — Viewer cannot access raw records
 */
router.get('/', verifyToken, requireRole('admin', 'analyst'), listRecords);

/**
 * @swagger
 * /api/records/{id}:
 *   get:
 *     summary: Get a single financial record by ID
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Financial record details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/FinancialRecord'
 *       403:
 *         description: Forbidden — Viewer cannot access raw records
 *       404:
 *         description: Record not found
 */
router.get('/:id', verifyToken, requireRole('admin', 'analyst'), getRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   put:
 *     summary: Update a financial record
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               type:
 *                 type: string
 *                 enum: [income, expense]
 *               category:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Record updated
 *       403:
 *         description: Forbidden — Viewer cannot update records
 *       404:
 *         description: Record not found
 */
router.put('/:id', verifyToken, requireRole('admin', 'analyst'), updateRecordValidator, updateRecord);

/**
 * @swagger
 * /api/records/{id}:
 *   delete:
 *     summary: Soft-delete a financial record (Admin only)
 *     tags: [Records]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Record deleted
 *       403:
 *         description: Forbidden — Admin only
 *       404:
 *         description: Record not found
 */
router.delete('/:id', verifyToken, requireRole('admin'), deleteRecord);

module.exports = router;
