const express = require('express')
const cookieParser = require('cookie-parser')

const createTestApp = (options = {}) => {
    const {
        verifyUserStub = (req, res, next) => next(),
        allowRolesStub = () => (req, res, next) => next(),
    } = options

    const app = express()

    app.use(cookieParser())
    app.use(express.json())
    app.use(express.urlencoded({ extended: true }))

    // Mock the real middlewares with stubs
    const mockArchiveRoute = require('../../routes/archive.route')

    // Create a new router and re-register routes with stubs
    const archiveController = require('../../controllers/archive.controller')
    const ROLES = require('../../constants/role.constant')
    const { validateObjectIdParam } = require('../../validators/common.validator')
    const router = express.Router()

    router.get(
        '/leads',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getAllArchivedLeads
    )

    router.get(
        '/leads/:id',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        validateObjectIdParam('id'),
        archiveController.getArchivedLead
    )

    router.get(
        '/call-logs',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getAllArchivedCallLogs
    )

    router.get(
        '/call-logs/:id',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getArchivedCallLog
    )

    router.get(
        '/pipelines',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getAllArchivedPipelines
    )

    router.get(
        '/pipelines/:id',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getArchivedPipeline
    )

    router.get(
        '/dropped-leads',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getAllDroppedLeads
    )

    router.get(
        '/dropped-leads/:id',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getDroppedLeadById
    )

    router.get(
        '/prospectus',
        verifyUserStub,
        allowRolesStub(ROLES.SUPER_ADMIN),
        archiveController.getAllArchivedProspectuses
    )

    app.use('/api/v1/archive', router)

    return app
}

module.exports = createTestApp
