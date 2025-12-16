const express = require('express')
const router = express.Router()

const { create, getAll, getALeadById, updateALeadById, deleteALeadById } = require('../controllers/lead.controller')
const { validateCreateLeadPayload } = require('../validators/lead.validator')
const { verifyUser } = require('../middlewares/auth.middleware')

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

    getALeadById,
)

router.patch(
    '/:id',

    verifyUser,

    updateALeadById,
)

router.delete(
    '/:id',

    verifyUser,

    deleteALeadById,
)

module.exports = router