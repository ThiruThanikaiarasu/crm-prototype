const mongoose = require('mongoose')
const ms = require('ms')

const refreshTokenTTL = process.env.REFRESH_TOKEN_TTL || '90d'

/**
 * @swagger
 * components:
 *   schemas:
 *     RefreshToken:
 *       type: object
 *       required:
 *         - user
 *         - token
 *       properties:
 *         user:
 *           type: string
 *           format: uuid
 *           description: The user ID associated with this token
 *         token:
 *           type: string
 *           description: The refresh token string
 *         deviceInfo:
 *           type: object
 *           properties:
 *             ip:
 *               type: string
 *             device:
 *               type: string
 *             os:
 *               type: string
 *             location:
 *               type: string
 *         isRevoked:
 *           type: boolean
 *           default: false
 *           description: Whether the token has been revoked
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: Expiration date of the token
 *         replacedByToken:
 *           type: string
 *           description: Token that replaced this one (if rotated)
 */
const createRefreshTokenSchema = (tenantId) => {
    return new mongoose.Schema(
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_users`,
                required: [true, 'User is a mandatory field'],
            },
            token: {
                type: String,
                required: [true, 'Refresh token is a mandatory field'],
            },
            deviceInfo: {
                ip: String,
                device: String,
                os: String,
                location: String,
            },
            isRevoked: {
                type: Boolean,
                default: false,
            },
            expiresAt: {
                type: Date,
                default: () => new Date(Date.now() + ms(refreshTokenTTL)),
            },
            replacedByToken: String,
        },
        {
            timestamps: true,
        },
    )
}

const refreshTokenModel = (tenantId) => {
    if (!tenantId) {
        throw new Error('Tenant id must be provided')
    }

    const collectionName = `${tenantId}_refreshTokens`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createRefreshTokenSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = refreshTokenModel
