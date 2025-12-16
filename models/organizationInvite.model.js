const mongoose = require('mongoose')

const organizationInviteSchema = new mongoose.Schema(
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
        collection: 'organizationInvites'
    }
)

module.exports = mongoose.model('OrganizationInvite', organizationInviteSchema)
