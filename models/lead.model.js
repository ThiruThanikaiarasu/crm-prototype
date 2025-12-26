const mongoose = require('mongoose')

const createLeadSchema = (tenantId) => {
    const leadSchema = new mongoose.Schema(
        {
            company: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_companyLeads`,
                required: [true, 'Company is a mandatory field'],
            },
            contact: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_contactLeads`,
            },
            status: {
                type: String,
                enum: {
                    values: ['new', 'qualified', 'contacted', 'done'],
                    message: '{VALUE} is not a valid status',
                },
                default: 'new',
            },
            source: {
                type: String,
                minLength: [2, 'Source must be at least 2 characters'],
                maxLength: [50, 'Source must be fewer than 50 characters'],
            },
            followUp: {
                type: Date,
            },
            owner: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_users`,
            },
            deleted: {
                isDeleted: {
                    type: Boolean,
                    default: false,
                    index: true,
                    select: false,
                },
                at: {
                    type: Date,
                    select: false,
                },
                by: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: `${tenantId}_users`,
                    select: false,
                },
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    )

    leadSchema.index(
        { company: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    leadSchema.pre(/^find/, function() {
        this.where({'deleted.isDeleted': false})
    })

    return leadSchema
}

const leadModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_leads`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createLeadSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = leadModel
