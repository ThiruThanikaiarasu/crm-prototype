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

describe('Archive Routes — Router Inventory', () => {
    let app

    beforeEach(() => {
        app = createTestApp()
    })

    test('route /api/v1/archive/leads/:id is registered', async () => {
        const validObjectId = '507f1f77bcf86cd799439011'
        const response = await request(app).get(
            `/api/v1/archive/leads/${validObjectId}`
        )
        // Expect not a 404 (route exists); may be 400, 401, or other due to mocks
        expect(response.statusCode).not.toBe(404)
    })

    test('route /api/v1/archive/leads:id is NOT registered', async () => {
        const response = await request(app).get(
            '/api/v1/archive/leads:id'
        )
        // Expect a 404 (route does not exist)
        expect(response.statusCode).toBe(404)
    })
})
