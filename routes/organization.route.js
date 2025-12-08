const express = require('express')
const router = express.Router()

const { verifyOrganization, createOrganization } = require('../controllers/organization.controller')
const { validateOrganizationRegisterPayload } = require('../validators/organization.validator')

router.post(
    '/verify',
    verifyOrganization
)

router.post(
    '/',

    validateOrganizationRegisterPayload,

    createOrganization
)

module.exports = router
