const { body } = require('express-validator')

const validateCreateCallLogPayload = [
    body('lead')
        .notEmpty()
        .withMessage('Lead is required')
        .isMongoId()
        .withMessage('Lead must be a valid ID'),

    body('outcome')
        .optional()
        .isIn(['intrested', 'not_intrested', 'contacted', 'done'])
        .withMessage('Invalid outcome value'),

    body('followUp')
        .notEmpty()
        .withMessage('Follow up date is required')
        .isISO8601()
        .withMessage('Follow up must be a valid date'),

    body('remarks')
        .notEmpty()
        .withMessage('Remarks is required')
        .isString()
        .withMessage('Remarks must be a string')
        .isLength({ min: 2, max: 500 })
        .withMessage('Remarks must be between 2 and 500 characters'),
]

module.exports = {
    validateCreateCallLogPayload,
}