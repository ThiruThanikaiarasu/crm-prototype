const express = require('express')
const { getAllArchivedLeads, getArchivedLead } = require('../controllers/archive.controller')
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

module.exports = router
