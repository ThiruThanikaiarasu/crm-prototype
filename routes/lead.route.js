const express = require('express')
const router = express.Router()

const { create, getAll } = require('../controllers/lead.controller')
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

module.exports = router