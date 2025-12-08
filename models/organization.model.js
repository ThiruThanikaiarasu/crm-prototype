const { default: mongoose } = require('mongoose')

const organizationSchema = new mongoose.Schema(
    {
        title: {
            type: String,
        },
        tenantId: {
            type: String,
            required: [true, 'Tenant Id is a mandatory field'],
        },
        domain: {
            type: String,
            required: [true, 'Domain is a mandatory field'],
        },
        admin: {
            type: mongoose.Schema.Types.ObjectId,
            required: [true, 'Admin is a mandatory field'],
        },
    },
    {
        timestamps: true,
        collection: 'organizations',
    },
)

module.exports = mongoose.model('organizations', organizationSchema)
