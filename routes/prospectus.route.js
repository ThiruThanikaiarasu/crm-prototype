const express = require('express')
const router = express.Router()

const {
    createANewProspectus,
    bulkCreateProspectuses,
    validateBulkProspectuses,
    getAll,
    getAProspectusById,
    updateAProspectusById,
    deleteAProspectusById,
    restoreAProspectusById
} = require('../controllers/prospectus.controller')
const {
    validateCreateANewProspectusPayload,
    validateBulkCreateProspectusPayload,
    validateGetAllProspectusQuery
} = require('../validators/prospectus.validator')
const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')
const ROLES = require('../constants/role.constant')

router.post(
    '/',

    verifyUser,

    validateCreateANewProspectusPayload,

    createANewProspectus,
)

router.post(
    '/bulk/validate',

    verifyUser,

    validateBulkCreateProspectusPayload,

    validateBulkProspectuses,
)

router.post(
    '/bulk',

    verifyUser,

    validateBulkCreateProspectusPayload,

    bulkCreateProspectuses,
)

router.get(
    '/',

    verifyUser,

    validateGetAllProspectusQuery,

    getAll,
)

router.get(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    getAProspectusById,
)

router.patch(
    '/:id/restore',

    verifyUser,

    validateObjectIdParam('id'),

    restoreAProspectusById,
)

router.patch(
    '/:id',

    verifyUser,

    validateObjectIdParam('id'),

    updateAProspectusById,
)

router.delete(
    '/:id',

    verifyUser,

    allowRoles(ROLES.SUPER_ADMIN, ROLES.ADMIN),

    validateObjectIdParam('id'),

    deleteAProspectusById,
)

module.exports = router
