const express = require('express')
const {
    getDashboardContent,
    getAdminDashboard,
    getSuperAdminDashboard,
} = require('../controllers/dashboard.controller')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const ROLES = require('../constants/role.constant')
const router = express.Router()

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard management
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard content
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard content retrieved successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get(
    '/',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.EMPLOYEE),

    getDashboardContent,
)

/**
 * @swagger
 * /dashboard/admin:
 *   get:
 *     summary: Get admin dashboard content
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin dashboard content retrieved successfully
 *       403:
 *         description: Forbidden - Admin access required
 */
router.get(
    '/admin',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    getAdminDashboard,
)

/**
 * @swagger
 * /dashboard/super-admin:
 *   get:
 *     summary: Get super-admin dashboard content
 *     tags: [Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Super-admin dashboard content retrieved successfully
 *       403:
 *         description: Forbidden - Super-admin access required
 */
router.get(
    '/super-admin',

    verifyUser,
    allowRoles(ROLES.SUPER_ADMIN),

    getSuperAdminDashboard,
)

module.exports = router
