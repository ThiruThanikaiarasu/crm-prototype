const express = require('express')
const router = express.Router()

const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')
const { create, getAll, getAPipelineById, updateAPipelineById, deleteAPipelineById, restoreAPipelineById, searchCompanyForPipelineHandler } = require('../controllers/pipeline.controller')
const ROLES = require('../constants/role.constant')
const { validateCreatePipelinePayload } = require('../validators/pipeline.validator')

router.get(
    '/search/company',

    verifyUser,

    searchCompanyForPipelineHandler
)

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

    validateObjectIdParam('id'),

    getAPipelineById
)

router.patch(
    '/:id/restore',

    verifyUser,

    validateObjectIdParam('id'),

    restoreAPipelineById
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    updateAPipelineById
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam('id'),

    deleteAPipelineById
)

module.exports = router