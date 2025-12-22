const express = require('express')
const router = express.Router()

const { create, getAll, getALeadById, updateALeadById, deleteALeadById } = require('../controllers/lead.controller')
const { validateCreateLeadPayload } = require('../validators/lead.validator')
const { verifyUser } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')

router.post(
    '/',

    verifyUser,

    validateCreateLeadPayload,

    create,
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

    validateObjectIdParam,

    deleteALeadById,
)

module.exports = router