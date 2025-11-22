const express = require('express')
const router = express.Router()

const { signup, login } = require('../controllers/auth.controller')
const {
    validateSignupPayload,
    validateLoginPayload,
} = require('../validators/auth.validator')

router.post(
    '/signup',

    validateSignupPayload,

    signup,
)

router.post(
    '/login',

    validateLoginPayload,

    login,
)

module.exports = router
