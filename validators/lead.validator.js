const { body } = require('express-validator')

const validateCreateANewLeadLeadPayload = [

    body('company.name')
        .notEmpty().withMessage('Company name is required')
        .isString().withMessage('Company name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),

    body('company.phone.extension')
        .optional({ nullable: true })
        .matches(/^\+\d+$/)
        .withMessage('Phone extension must start with + and contain numbers only'),

    body('company.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('company.website')
        .optional({ nullable: true })
        .isURL({
            require_protocol: false
        })
        .withMessage('Website must be a valid URL'),

    body('company.socialProfile')
        .optional({ nullable: true })
        .isURL({
            require_protocol: false
        })
        .withMessage('Social profile must be a valid URL'),

    body('leads')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Leads must be an array'),

    body('leads.*.name')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Contact name must be between 2 and 50 characters'),

    body('leads.*.phone.extension')
        .optional({ nullable: true })
        .matches(/^\+\d+$/)
        .withMessage('Phone extension must start with + and contain numbers only'),

    body('leads.*.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('leads.*.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid email address'),

    body('leads.*.status')
        .optional({ nullable: true })
        .isIn(['new', 'qualified', 'contacted', 'done'])
        .withMessage('Invalid lead status'),

    body('leads.*.source')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Source must be between 2 and 50 characters'),

    body('leads.*.followUp')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Follow up must be a valid date'),

    body('leads.*.priority')
        .optional({ nullable: true })
        .isInt({ min: 1 })
        .withMessage('Priority must be a number greater than or equal to 1'),
]


module.exports = {
    validateCreateANewLeadLeadPayload,
}
