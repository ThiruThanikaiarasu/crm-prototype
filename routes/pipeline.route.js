const express = require('express')
const router = express.Router()

const { verifyUser, allowRoles } = require('../middlewares/auth.middleware')
const { validateObjectIdParam } = require('../validators/common.validator')


router.post(
    '/',

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