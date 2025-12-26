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
        .isURL()
        .withMessage('Website must be a valid URL'),

    body('company.socialProfile')
        .optional({ nullable: true })
        .isURL()
        .withMessage('Social profile must be a valid URL'),

    body('contacts')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Contacts must be an array'),

    body('contacts.*.name')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Contact name must be between 2 and 50 characters'),

    body('contacts.*.phone.extension')
        .optional({ nullable: true })
        .matches(/^\+\d+$/)
        .withMessage('Phone extension must start with + and contain numbers only'),

    body('contacts.*.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('contacts.*.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid email address'),

    body('status')
        .optional({ nullable: true })
        .isIn(['new', 'qualified', 'contacted', 'done'])
        .withMessage('Invalid lead status'),

    body('source')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Source must be between 2 and 50 characters'),

    body('followUp')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Follow up must be a valid date'),
]


module.exports = {
    validateCreateANewLeadLeadPayload,
}
