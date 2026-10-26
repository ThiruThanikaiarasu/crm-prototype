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
const ROLES = require('../../constants/role.constant')

describe('GET /api/v1/archive/leads/:id — Authorization', () => {
    const validObjectId = '507f1f77bcf86cd799439011'

    describe('Returns 401 when unauthenticated', () => {
        it('should return 401 when no authentication provided', async () => {
            const verifyUserStub = (req, res, next) => {
                res.status(401).send({
                    message: 'Session Expired',
                    errorCode: 'AUTH_TOKEN_MISSING',
                    error: 'authentication_error',
                    data: null,
                })
            }

            const allowRolesStub = () => (req, res, next) => next()

            const app = createTestApp({
                verifyUserStub,
                allowRolesStub,
            })

            const response = await request(app)
                .get(`/api/v1/archive/leads/${validObjectId}`)
                .expect(401)

            expect(response.body.message).toBeDefined()
            expect(response.body.errorCode).toBeDefined()
        })
    })

    describe('Returns 403 when authenticated but insufficient permissions', () => {
        it('should return 403 when user role is not SUPER_ADMIN', async () => {
            const verifyUserStub = (req, res, next) => {
                req.user = {
                    userId: 'user123',
                    tenantId: 'tenant123',
                    role: ROLES.EMPLOYEE,
                }
                next()
            }

            const allowRolesStub = (...allowedRoles) => (req, res, next) => {
                if (!allowedRoles.includes(req.user.role)) {
                    return res.status(403).send({
                        message: "You don't have access to this resource",
                        errorCode: 'INSUFFICIENT_PERMISSIONS',
                        error: 'authorization_error',
                        data: null,
                    })
                }
                next()
            }

            const app = createTestApp({
                verifyUserStub,
                allowRolesStub,
            })

            const response = await request(app)
                .get(`/api/v1/archive/leads/${validObjectId}`)
                .expect(403)

            expect(response.body.message).toBeDefined()
            expect(response.body.errorCode).toBeDefined()
        })
    })
})
