const { body } = require('express-validator')

const validateOrganizationRegisterPayload = [
    body('title')
        .notEmpty().withMessage('Title is a mandatory field')
        .isString().withMessage('Title must be a string')
        .isLength({ min: 2, max: 50 })
        .withMessage('Title length must be between 2 and 50 characters'),

    body('firstName')
        .notEmpty().withMessage('First name is a mandatory field')
        .isString().withMessage('First name must be a string')
        .isLength({ min: 2, max: 25 })
        .withMessage('First name length must be between 2 and 25 characters'),

    body('lastName')
        .notEmpty().withMessage('Last name must be a mandatory field')
        .isString().withMessage('Last name must be a string')
        .isLength({ min: 1, max: 25 })
        .withMessage('Last name length must be between 1 and 25 characters'),

    body('email')
        .notEmpty().withMessage('Email is a mandatory field')
        .isEmail().withMessage('Please provide a valid email address')
        .trim()
        .toLowerCase(),

    body('password')
        .notEmpty().withMessage('Password is a mandatory field')
        .isString().withMessage('Password must be a string')
        .isLength({ min: 8, max: 25 })
        .withMessage('Password must be between 8 and 25 characters'),
]

module.exports = {
    validateOrganizationRegisterPayload,
}
