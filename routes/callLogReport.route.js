const express = require('express')
const router = express.Router()

const { getCallLogReports } = require('../controllers/callLogReport.controller')
const { validateCallLogReportQuery } = require('../validators/callLogReport.validator')
const { verifyUser } = require('../middlewares/auth.middleware')

/**
 * @route GET /api/call-log-reports
 * @desc Get call log reports with filtering
 * @access Private
 *
 * Query params:
 * - period: 'day' | 'week' | 'month' (optional, default: 'day')
 * - date: ISO date string (optional, filters based on period)
 * - lead: Lead ID (optional)
 * - createdBy: User ID who created the call log (optional)
 * - page: Page number (optional, default: 1)
 * - limit: Items per page (optional, default: 10)
 * - sort: Sort field (optional, default: 'createdAt')
 * - order: 'asc' | 'desc' (optional, default: 'desc')
 */
router.get(
    '/',

    verifyUser,

    validateCallLogReportQuery,

    getCallLogReports
)

module.exports = router
