process.env.DB_URI = 'mongodb://localhost/test'
process.env.JWT_ACCESS_SECRET = 'test_secret'
process.env.JWT_REFRESH_SECRET = 'test_refresh_secret'
process.env.ACCESS_TOKEN_TTL = '1h'
process.env.REFRESH_TOKEN_TTL = '7d'
process.env.EMAIL_USER = 'test@example.com'
process.env.EMAIL_PASS = 'password'
process.env.CORS_ORIGIN_URL = 'http://localhost:3000'

const request = require('supertest')
const createTestApp = require('../helpers/createTestApp')
const archiveService = require('../../services/archive.service')

jest.mock('../../services/archive.service')

describe('GET /api/v1/archive/leads/:id', () => {
    describe('Returns 404 when lead not found', () => {
        it('should return 404 when no archived lead matches the valid id', async () => {
            const validObjectId = '507f1f77bcf86cd799439011'

            const verifyUserStub = (req, res, next) => {
                req.user = {
                    userId: 'user123',
                    tenantId: 'tenant123',
                    role: 'super_admin'
                }
                next()
            }

            const allowRolesStub = () => (req, res, next) => next()

            const app = createTestApp({
                verifyUserStub,
                allowRolesStub
            })

            archiveService.getArchivedLeadById.mockResolvedValue(null)

            const response = await request(app)
                .get(`/api/v1/archive/leads/${validObjectId}`)
                .expect(404)

            expect(response.body.message).toBeDefined()
            expect(response.body.errorCode).toBeDefined()

            // Assert service method was called with correct params
            expect(archiveService.getArchivedLeadById).toHaveBeenCalledWith(
                'tenant123',
                validObjectId
            )
        })
    })
})
