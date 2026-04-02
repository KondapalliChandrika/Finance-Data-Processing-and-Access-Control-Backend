const { body } = require('express-validator');

const updateUserValidator = [
    body('role')
        .optional()
        .isIn(['viewer', 'analyst', 'admin'])
        .withMessage('Role must be viewer, analyst, or admin'),
    body('status')
        .optional()
        .isIn(['active', 'inactive'])
        .withMessage('Status must be active or inactive'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
];

module.exports = { updateUserValidator };
