const { body } = require('express-validator')

const validateCreateCallLogPayload = [
    // lead is optional - if not provided, companyId + leadName must be provided
    body('lead')
        .optional()
        .isMongoId()
        .withMessage('Lead must be a valid ID'),

    // companyId is required only if lead is not provided
    body('companyId')
        .optional()
        .isMongoId()
        .withMessage('Company ID must be a valid ID'),

    // leadName is required only if lead is not provided
    body('leadName')
        .optional()
        .isString()
        .withMessage('Lead name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Lead name must be between 2 and 100 characters'),

    // Custom validation: either lead OR (companyId + leadName) must be provided
    body().custom((value, { req }) => {
        const { lead, companyId, leadName } = req.body
        if (!lead && (!companyId || !leadName)) {
            throw new Error('Either lead ID or (companyId + leadName) is required')
        }
        return true
    }),

    body('outcome')
        .optional()
        .isIn(['interested', 'not_interested', 'contacted', 'done'])
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

    body('callStartTime')
        .notEmpty()
        .withMessage('Call start time is required')
        .isISO8601()
        .withMessage('Call start time must be a valid date'),

    body('callDuration')
        .notEmpty()
        .withMessage('Call duration is required')
        .isInt({ min: 0 })
        .withMessage('Call duration must be a non-negative integer (seconds)'),
]

module.exports = {
    validateCreateCallLogPayload,
}