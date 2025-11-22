const express = require('express')
const router = express.Router()

const {
    signup,
    login,
    refreshAccessToken,
} = require('../controllers/auth.controller')
const {
    validateSignupPayload,
    validateLoginPayload,
} = require('../validators/auth.validator')
const {
    verifyUser,
    getRefreshToken,
} = require('../middlewares/auth.middleware')

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

router.post(
    '/refresh',

    getRefreshToken,

    refreshAccessToken,
)

module.exports = router
