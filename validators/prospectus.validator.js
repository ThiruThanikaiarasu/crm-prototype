const { body, query } = require('express-validator')

const PROSPECTUS_STATUSES = ['new', 'qualified']

const SERVICE_NAMES = [
    'hiring_service',
    'peo_and_eor',
    'digital_marketing',
    'digital_solutions',
]

const companyFields = [
    body('company.name')
        .notEmpty().withMessage('Company name is required')
        .isString().withMessage('Company name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),

    body('company.phone.number')
        .notEmpty().withMessage('Company phone number is required')
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('company.phone.countryCode')
        .optional({ nullable: true })
        .isLength({ max: 5 })
        .withMessage('Phone country code must be fewer than 5 characters')
        .matches(/^\+\d+$/)
        .withMessage('Phone country code must start with + and contain numbers only'),

    body('company.phone.extension')
        .optional({ nullable: true })
        .isLength({ max: 10 })
        .withMessage('Phone extension must be fewer than 10 characters')
        .matches(/^\d+$/)
        .withMessage('Phone extension must contain digits only'),

    body('company.serviceType')
        .optional({ nullable: true })
        .isIn(SERVICE_NAMES)
        .withMessage('Invalid service name'),

    body('company.address.door')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9\/\- ]{1,20}$/)
        .withMessage('Door number can contain letters, numbers, space, / or - (max 20 characters)'),

    body('company.address.street')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9.,\- ]{3,100}$/)
        .withMessage('Street name must be 3–100 characters and can include letters, numbers, space, comma, dot or hyphen'),

    body('company.address.area')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9.,\- ]{2,100}$/)
        .withMessage('Area must be 2–100 characters'),

    body('company.address.city')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z ]{2,50}$/)
        .withMessage('City should contain only letters and spaces (2–50 characters)'),

    body('company.address.pincode')
        .optional({ nullable: true })
        .matches(/^[1-9][0-9]{4}$/)
        .withMessage('Pincode must be a valid 5-digit postal code'),

    body('company.address.location.latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    body('company.address.location.longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    body('company.address.shortAddress')
        .optional({ nullable: true })
        .matches(/^[A-Z]{4}[0-9]{4}$/)
        .withMessage('Short address must be 8 characters: 4 uppercase letters followed by 4 digits (e.g., RRRD2929)'),

    body('company.website')
        .optional({ nullable: true })
        .isURL({ require_protocol: false })
        .withMessage('Website must be a valid URL'),

    body('company.socialProfile')
        .optional({ nullable: true })
        .isURL({ require_protocol: false })
        .withMessage('Social profile must be a valid URL'),

    body('company.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid company email address'),
]

const contactFields = [
    body('leads')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Leads must be an array'),

    body('leads.*.contact.name')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Contact name must be between 2 and 50 characters'),

    body('leads.*.contact.phone.countryCode')
        .optional({ nullable: true })
        .isLength({ max: 5 })
        .withMessage('Phone country code must be fewer than 5 characters')
        .matches(/^\+\d+$/)
        .withMessage('Phone country code must start with + and contain numbers only'),

    body('leads.*.contact.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('leads.*.contact.phone.extension')
        .optional({ nullable: true })
        .isLength({ max: 10 })
        .withMessage('Phone extension must be fewer than 10 characters')
        .matches(/^\d+$/)
        .withMessage('Phone extension must contain digits only'),

    body('leads.*.contact.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid email address'),

    body('leads.*.contact.department')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Department must be between 2 and 50 characters'),

    body('leads.*.contact.remarks')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 255 })
        .withMessage('Remarks must be between 2 and 255 characters'),

    body('leads.*.status')
        .optional({ nullable: true })
        .isIn(PROSPECTUS_STATUSES)
        .withMessage('Invalid prospectus status. Allowed values: new, qualified'),

    body('leads.*.source')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Source must be between 2 and 50 characters'),

    body('leads.*.benificiary.name')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Beneficiary name must be between 2 and 50 characters'),

    body('leads.*.benificiary.phone.countryCode')
        .optional({ nullable: true })
        .isLength({ max: 5 })
        .withMessage('Beneficiary phone country code must be fewer than 5 characters')
        .matches(/^\+\d+$/)
        .withMessage('Beneficiary phone country code must start with + and contain numbers only'),

    body('leads.*.benificiary.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Beneficiary phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Beneficiary phone number must contain digits only'),

    body('leads.*.benificiary.phone.extension')
        .optional({ nullable: true })
        .isLength({ max: 10 })
        .withMessage('Beneficiary phone extension must be fewer than 10 characters')
        .matches(/^\d+$/)
        .withMessage('Beneficiary phone extension must contain digits only'),

    body('leads.*.followUp')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Follow up must be a valid date'),

    body('leads.*.priority')
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage('Priority must be a number greater than or equal to 0'),
]

const validateCreateANewProspectusPayload = [
    ...companyFields,
    ...contactFields,
]

const validateBulkCreateProspectusPayload = [
    body()
        .isArray({ min: 1 })
        .withMessage('Request body must be a non-empty array of prospectuses'),

    body('*.company.name')
        .notEmpty().withMessage('Company name is required for each prospectus')
        .isString().withMessage('Company name must be a string')
        .isLength({ min: 2, max: 100 })
        .withMessage('Company name must be between 2 and 100 characters'),

    body('*.company.phone.number')
        .notEmpty().withMessage('Company phone number is required for each prospectus')
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('*.company.phone.countryCode')
        .optional({ nullable: true })
        .isLength({ max: 5 })
        .withMessage('Phone country code must be fewer than 5 characters')
        .matches(/^\+\d+$/)
        .withMessage('Phone country code must start with + and contain numbers only'),

    body('*.company.phone.extension')
        .optional({ nullable: true })
        .isLength({ max: 10 })
        .withMessage('Phone extension must be fewer than 10 characters')
        .matches(/^\d+$/)
        .withMessage('Phone extension must contain digits only'),

    body('*.company.serviceType')
        .optional({ nullable: true })
        .isIn(SERVICE_NAMES)
        .withMessage('Invalid service name'),

    body('*.company.address.door')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9\/\- ]{1,20}$/)
        .withMessage('Door number can contain letters, numbers, space, / or - (max 20 characters)'),

    body('*.company.address.street')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9.,\- ]{3,100}$/)
        .withMessage('Street name must be 3–100 characters'),

    body('*.company.address.area')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z0-9.,\- ]{2,100}$/)
        .withMessage('Area must be 2–100 characters'),

    body('*.company.address.city')
        .optional({ nullable: true })
        .matches(/^[a-zA-Z ]{2,50}$/)
        .withMessage('City should contain only letters and spaces (2–50 characters)'),

    body('*.company.address.pincode')
        .optional({ nullable: true })
        .matches(/^[1-9][0-9]{4}$/)
        .withMessage('Pincode must be a valid 5-digit postal code'),

    body('*.company.address.location.latitude')
        .optional({ nullable: true })
        .isFloat({ min: -90, max: 90 })
        .withMessage('Latitude must be between -90 and 90'),

    body('*.company.address.location.longitude')
        .optional({ nullable: true })
        .isFloat({ min: -180, max: 180 })
        .withMessage('Longitude must be between -180 and 180'),

    body('*.company.address.shortAddress')
        .optional({ nullable: true })
        .matches(/^[A-Z]{4}[0-9]{4}$/)
        .withMessage('Short address must be 8 characters: 4 uppercase letters followed by 4 digits'),

    body('*.company.website')
        .optional({ nullable: true })
        .isURL({ require_protocol: false })
        .withMessage('Website must be a valid URL'),

    body('*.company.socialProfile')
        .optional({ nullable: true })
        .isURL({ require_protocol: false })
        .withMessage('Social profile must be a valid URL'),

    body('*.company.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid company email address'),

    body('*.leads')
        .optional({ nullable: true })
        .isArray()
        .withMessage('Leads must be an array'),

    body('*.leads.*.contact.name')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Contact name must be between 2 and 50 characters'),

    body('*.leads.*.contact.phone.countryCode')
        .optional({ nullable: true })
        .isLength({ max: 5 })
        .withMessage('Phone country code must be fewer than 5 characters')
        .matches(/^\+\d+$/)
        .withMessage('Phone country code must start with + and contain numbers only'),

    body('*.leads.*.contact.phone.number')
        .optional({ nullable: true })
        .isLength({ min: 8, max: 15 })
        .withMessage('Phone number must be between 8 and 15 digits')
        .matches(/^\d+$/)
        .withMessage('Phone number must contain digits only'),

    body('*.leads.*.contact.phone.extension')
        .optional({ nullable: true })
        .isLength({ max: 10 })
        .withMessage('Phone extension must be fewer than 10 characters')
        .matches(/^\d+$/)
        .withMessage('Phone extension must contain digits only'),

    body('*.leads.*.contact.email')
        .optional({ nullable: true })
        .isEmail()
        .withMessage('Please provide a valid email address'),

    body('*.leads.*.contact.department')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Department must be between 2 and 50 characters'),

    body('*.leads.*.contact.remarks')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 255 })
        .withMessage('Remarks must be between 2 and 255 characters'),

    body('*.leads.*.status')
        .optional({ nullable: true })
        .isIn(PROSPECTUS_STATUSES)
        .withMessage('Invalid prospectus status. Allowed values: new, qualified'),

    body('*.leads.*.source')
        .optional({ nullable: true })
        .isLength({ min: 2, max: 50 })
        .withMessage('Source must be between 2 and 50 characters'),

    body('*.leads.*.followUp')
        .optional({ nullable: true })
        .isISO8601()
        .withMessage('Follow up must be a valid date'),

    body('*.leads.*.priority')
        .optional({ nullable: true })
        .isInt({ min: 0 })
        .withMessage('Priority must be a number greater than or equal to 0'),
]

const validateGetAllProspectusQuery = [
    query('serviceType')
        .optional()
        .custom((value) => {
            if (Array.isArray(value)) {
                const allValid = value.every(type => SERVICE_NAMES.includes(type))
                if (!allValid) {
                    throw new Error(`Invalid service type. Allowed values: ${SERVICE_NAMES.join(', ')}`)
                }
                return true
            }
            if (typeof value === 'string') {
                if (!SERVICE_NAMES.includes(value)) {
                    throw new Error(`Invalid service type. Allowed values: ${SERVICE_NAMES.join(', ')}`)
                }
                return true
            }
            throw new Error('Service type must be a string or array of strings')
        })
        .withMessage('Invalid service type format'),

    query('status')
        .optional()
        .isIn(PROSPECTUS_STATUSES)
        .withMessage('Invalid prospectus status. Allowed values: new, qualified'),
]

module.exports = {
    validateCreateANewProspectusPayload,
    validateBulkCreateProspectusPayload,
    validateGetAllProspectusQuery,
}
