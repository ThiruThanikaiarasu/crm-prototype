const express = require('express')
const router = express.Router()

const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { create, getAll, deleteACallLog, updateACallLog, getACallLog, searchCompaniesHandler, searchLeadsForCallLogHandler, restoreACallLog, getPreviousCallLog, getCompanyCallLogActivity } = require('../controllers/callLog.controller')
const { validateCreateCallLogPayload } = require('../validators/callLog.validator')
const { validateObjectIdParam } = require('../validators/common.validator')
const ROLES = require('../constants/role.constant')

// Search routes (must be before /:id to avoid conflict)
router.get(
    '/search/company',

    verifyUser,

    searchCompaniesHandler
)

router.get(
    '/search/leads',

    verifyUser,

    searchLeadsForCallLogHandler
)

router.post(
    '/',

    validateCreateCallLogPayload,

    verifyUser,

    create
)

router.get(
    '/:leadId/previous',

    verifyUser,

    validateObjectIdParam('leadId'),

    getPreviousCallLog,
)

router.get(
    '/:companyId/activity',

    verifyUser,

    validateObjectIdParam('companyId'),

    getCompanyCallLogActivity,
)

router.get(
    '/',

    verifyUser,

    getAll
)

router.patch(
    '/:id/restore',

    verifyUser,

    validateObjectIdParam('id'),

    restoreACallLog
)

router.get(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    getACallLog
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    updateACallLog
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam('id'),

    deleteACallLog
)

module.exports = router
