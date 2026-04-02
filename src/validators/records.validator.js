const { body } = require('express-validator');

const createRecordValidator = [
    body('amount')
        .isFloat({ gt: 0 })
        .withMessage('Amount must be a positive number'),
    body('type')
        .isIn(['income', 'expense'])
        .withMessage('Type must be income or expense'),
    body('category')
        .trim()
        .notEmpty()
        .withMessage('Category is required'),
    body('date')
        .isISO8601()
        .toDate()
        .withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
    body('notes').optional().trim(),
];

const updateRecordValidator = [
    body('amount')
        .optional()
        .isFloat({ gt: 0 })
        .withMessage('Amount must be a positive number'),
    body('type')
        .optional()
        .isIn(['income', 'expense'])
        .withMessage('Type must be income or expense'),
    body('category')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Category cannot be empty'),
    body('date')
        .optional()
        .isISO8601()
        .toDate()
        .withMessage('Date must be a valid ISO 8601 date (YYYY-MM-DD)'),
    body('notes').optional().trim(),
];

module.exports = { createRecordValidator, updateRecordValidator };
