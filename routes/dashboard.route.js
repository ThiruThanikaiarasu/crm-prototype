const express = require('express')
const { getDashboardContent, getAdminDashboard, getSuperAdminDashboard } = require('../controllers/dashboard.controller')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const ROLES = require('../constants/role.constant')
const router = express.Router()

router.get(
    '/',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE),

    getDashboardContent
)

router.get(
    '/admin',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    getAdminDashboard
)

router.get(
    '/super-admin',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN),

    getSuperAdminDashboard
)

module.exports = router
