const express = require('express')
const { getAllArchivedLeads, getArchivedLead, getAllArchivedCallLogs, getAllArchivedPipelines, getArchivedCallLog, getArchivedPipeline, getAllDroppedLeads, getDroppedLeadById } = require('../controllers/archive.controller')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const ROLES = require('../constants/role.constant')
const router = express.Router()

router.get(
    '/leads',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getAllArchivedLeads
)

router.get(
    '/leads:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getArchivedLead
)

router.get(
    '/call-logs',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getAllArchivedCallLogs
)

router.get(
    '/call-logs/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getArchivedCallLog
)

router.get(
    '/pipelines',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getAllArchivedPipelines
)

router.get(
    '/pipelines/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getArchivedPipeline
)

router.get(
    '/dropped-leads',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getAllDroppedLeads
)

router.get(
    '/dropped-leads/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    getDroppedLeadById
)

module.exports = router
