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
    describe('Returns 400 on invalid ObjectId', () => {
        it('should return 400 when id is not a valid ObjectId', async () => {
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

            const response = await request(app)
                .get('/api/v1/archive/leads/abc')
                .expect(400)

            expect(response.body.message).toBeDefined()
            expect(response.body.errorCode).toBeDefined()

            // Assert service method was not called
            expect(archiveService.getArchivedLeadById).not.toHaveBeenCalled()
        })
    })
})
