const express = require('express')
const router = express.Router()

const { verifyOrganization, createOrganization, inviteStatus, inviteUsers, getMembers } = require('../controllers/organization.controller')
const { validateOrganizationRegisterPayload } = require('../validators/organization.validator')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const ROLES = require('../constants/role.constant')
const { verifyInvite } = require('../controllers/invite.controller')

router.post(
    '/verify',
    verifyOrganization
)

router.post(
    '/',

    validateOrganizationRegisterPayload,

    createOrganization
)

router.get(
    '/invite/status',

    verifyUser,

    inviteStatus
)

router.post(
    '/invite',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN),

    inviteUsers
)

router.get(
    '/members',

    verifyUser,

    getMembers
)

router.get(
    '/invite/validate',

    verifyInvite
)

module.exports = router
