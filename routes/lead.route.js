const express = require('express')
const router = express.Router()

const { createANewLead, getAll, getALeadById, updateALeadById, deleteALeadById } = require('../controllers/lead.controller')
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

    validateObjectIdParam,

    getALeadById,
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam,

    updateALeadById,
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam,

    deleteALeadById,
)

module.exports = router