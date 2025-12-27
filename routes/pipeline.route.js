const express = require('express')
const router = express.Router()

const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')
const { create, getAll, getAPipelineById, updateAPipelineById, deleteAPipelineById } = require('../controllers/pipeline.controller')
const ROLES = require('../constants/role.constant')
const { validateCreatePipelinePayload } = require('../validators/pipeline.validator')


router.post(
    '/',

    verifyUser,

    validateCreatePipelinePayload,

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

    getAPipelineById
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam,

    updateAPipelineById
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam,

    deleteAPipelineById
)

module.exports = router