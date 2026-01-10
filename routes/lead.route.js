const express = require('express')
const router = express.Router()

const { createANewLead, getAll, getALeadById, updateALeadById, deleteALeadById, restoreALeadById } = require('../controllers/lead.controller')
const { validateCreateANewLeadLeadPayload } = require('../validators/lead.validator')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')
const ROLES = require('../constants/role.constant')

router.post(
    '/',

    verifyUser,

    validateCreateANewLeadLeadPayload,

    createANewLead,
)

router.get(
    '/',

    verifyUser,

    getAll,
)

router.get(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    getALeadById,
)

router.patch(
    '/:id/restore',

    verifyUser,

    validateObjectIdParam('id'),

    restoreALeadById,
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    updateALeadById,
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam('id'),

    deleteALeadById,
)

module.exports = router