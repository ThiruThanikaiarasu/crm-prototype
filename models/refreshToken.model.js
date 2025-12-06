const mongoose = require('mongoose')
const ms = require('ms')

const refreshTokenTTL = process.env.REFRESH_TOKEN_TTL || '90d'

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
