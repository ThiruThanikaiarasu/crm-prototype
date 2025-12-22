const express = require('express')
const router = express.Router()

const { verifyUser } = require('../middlewares/auth.middleware')
const { create, getAll, deleteACallLog, updateACallLog, getACallLog } = require('../controllers/callLog.controller')
const { validateCreateCallLogPayload } = require('../validators/callLog.validator')
const { validateObjectIdParam } = require('../validators/common.validator')

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

    validateObjectIdParam,

    getACallLog
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam,

    updateACallLog
)

router.delete(
    '/:id',

    verifyUser,

    validateObjectIdParam,

    deleteACallLog
)

module.exports = router
