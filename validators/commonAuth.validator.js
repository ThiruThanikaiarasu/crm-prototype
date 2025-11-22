const { body } = require('express-validator');

const validateFirstName = () => {
    return body('firstName')
        .notEmpty()
            .withMessage('First name is a mandatory field')
        .isLength({ min: 2 })
            .withMessage('First name length must be greater than 2')
        .isLength({ max: 25 })
            .withMessage('First name length must be less than 25')
        .matches(/^[a-zA-Z\s]+$/)
            .withMessage('First name must contain only letters and spaces');
};

const validateLastName = () => {
    return body('lastName')
        .notEmpty()
            .withMessage('Last name is a mandatory field')
        .isLength({ min: 1 })
            .withMessage('Last name length must be greater than 1')
        .isLength({ max: 25 })
            .withMessage('Last name length must be less than 25')
        .matches(/^[a-zA-Z\s]+$/)
            .withMessage('Last name must contain only letters and spaces');
};

const validateEmail = () => {
    return body('email')
        .notEmpty()
            .withMessage('Email is a mandatory field')
        .isLength({ max: 254 })
            .withMessage('Email must not exceed 254 characters')
        .isEmail()
            .withMessage('Invalid email format');
};

const validatePassword = () => {
    return body('password')
        .notEmpty()
            .withMessage('Password is a mandatory field')
        .isLength({ min: 8, max: 25 })
            .withMessage('Password must be between 8 and 25 characters')
        .matches(/[a-z]/)
            .withMessage('Password must contain at least one lowercase letter')
        .matches(/[A-Z]/)
            .withMessage('Password must contain at least one uppercase letter')
        .matches(/\d/)
            .withMessage('Password must contain at least one number')
        .matches(/[ !"#$%&'()*+,-./:;<=>?@[\\\]^_`{|}~]/)
            .withMessage('Password must contain at least one special character');
};

const validateRole = () => {
    return body('role')
        .optional()
        .isIn(['super_admin', 'admin', 'employee'])
        .withMessage('Role must be super_admin, admin, or employee');
};

const validateTenantId = () => {
    return body('tenantId')
        .optional()
        .isString()
        .withMessage('tenantId must be a string');
};

const validateProfileImage = () => {
    return body('profileImage')
        .optional()
        .isURL()
        .withMessage('profileImage must be a valid URL');
};

module.exports = {
    validateFirstName,
    validateLastName,
    validateEmail,
    validatePassword,
    validateRole,
    validateTenantId,
    validateProfileImage
};
