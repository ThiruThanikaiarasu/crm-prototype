const { body } = require('express-validator')

const validateCreateLeadPayload = [
    body('company')
        .notEmpty().withMessage('Company is a mandatory field')
        .isString().withMessage('Company must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),

    body('contact')
        .notEmpty().withMessage('Contact is a mandatory field')
        .isString().withMessage('Contact must be a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('Contact name must be between 2 and 50 characters'),

    body('phone.ext')
        .optional()
        .isString().withMessage('Phone extension must be a string')
        .matches(/^\+\d+$/).withMessage('Phone extension must start with + and contain digits only')
        .isLength({ max: 5 }).withMessage('Phone extension must be fewer than 5 characters'),

    body('phone.number')
        .optional()
        .isString().withMessage('Phone number must be a string')
        .matches(/^\d+$/).withMessage('Phone number must contain digits only')
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 characters'),

    body('email')
        .notEmpty().withMessage('Email is a mandatory field')
        .isEmail().withMessage('Please provide a valid email address'),

    body('status')
        .optional()
        .isIn(['new', 'qualified', 'contacted', 'done'])
        .withMessage('Invalid status value'),

    body('source')
        .optional()
        .isString().withMessage('Source must be a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('Source must be between 2 and 50 characters'),
]

module.exports = {
    validateCreateLeadPayload,
}
