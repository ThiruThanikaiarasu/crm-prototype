const express = require('express')
const router = express.Router()

const { verifyUser } = require('../middlewares/auth.middleware')
const { create, getAll, deleteACallLog, updateACallLog, getACallLog } = require('../controllers/callLog.controller')
const { validateCreateCallLogPayload } = require('../validators/callLog.validator')

router.post(
    '/',

    validateCreateCallLogPayload,

    verifyUser,

    create
)

router.get(
    '/',

    verifyUser,

    getAll
)

router.get(
    '/:id',

    verifyUser,

    getACallLog
)

router.patch(
    '/:id',

    verifyUser,

    updateACallLog
)

router.delete(
    '/:id',

    verifyUser,

    deleteACallLog
)

module.exports = router
