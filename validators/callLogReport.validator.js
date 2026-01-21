const { query } = require('express-validator')

/**
 * Validator for call log report query parameters
 * Supports filtering by:
 * - period: 'day', 'week', 'month'
 * - date: ISO date string
 * - lead: MongoDB ObjectId
 * - createdBy: MongoDB ObjectId
 * - page, limit: pagination
 * - sort, order: sorting
 */
const validateCallLogReportQuery = [
    query('period')
        .optional()
        .isIn(['day', 'week', 'month'])
        .withMessage('Period must be one of: day, week, month'),

    query('date')
        .optional()
        .isISO8601()
        .withMessage('Date must be a valid ISO 8601 date string'),

    query('lead')
        .optional()
        .isMongoId()
        .withMessage('Lead must be a valid MongoDB ObjectId'),

    query('createdBy')
        .optional()
        .isMongoId()
        .withMessage('CreatedBy must be a valid MongoDB ObjectId'),

    query('page')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page must be a positive integer'),

    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 })
        .withMessage('Limit must be between 1 and 100'),

    query('sort')
        .optional()
        .isIn(['createdAt', 'callStartTime', 'callDuration', 'outcome', 'company', 'contact'])
        .withMessage('Sort must be one of: createdAt, callStartTime, callDuration, outcome, company, contact'),

    query('order')
        .optional()
        .isIn(['asc', 'desc'])
        .withMessage('Order must be either asc or desc')
]

module.exports = {
    validateCallLogReportQuery
}
