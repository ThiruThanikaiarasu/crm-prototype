const mongoose = require('mongoose')

const createOrganizationInviteSchema = () => {
    return new mongoose.Schema(
        {
            email: {
                type: String,
                required: [true, 'Email is a mandatory field'],
                unique: true,
                lowercase: true,
            },
            status: {
                type: String,
                enum: ['not_sent', 'sent', 'pending', 'accepted', 'rejected'],
                default: 'not_sent',
            },
            retryCount: {
                type: Number,
                default: 0,
            },
            lastTried: {
                type: Date,
                default: Date.now,
            },
            maxRetries: {
                type: Number,
                default: 3,
            },
        },
        {
            timestamps: true,
        }
    )
}

const organizationInviteModel = (tenantId) => {
    if (!tenantId) {
        throw new Error('Tenant id must be a value')
    }

    const modelName = `${tenantId}_organizationInvites`

    if (mongoose.models[modelName]) {
        return mongoose.models[modelName]
    }

    const schema = createOrganizationInviteSchema()
    return mongoose.model(modelName, schema)
}


module.exports = organizationInviteModel