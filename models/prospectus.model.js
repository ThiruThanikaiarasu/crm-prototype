const mongoose = require('mongoose')

const createProspectusSchema = (tenantId) => {
    const prospectusSchema = new mongoose.Schema(
        {
            company: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_companyProspectuses`,
                required: [true, 'Company is a mandatory field'],
            },
            contact: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_contactProspectuses`,
            },
            status: {
                type: String,
                enum: {
                    values: ['new', 'qualified'],
                    message: '{VALUE} is not a valid status',
                },
                default: 'new',
            },
            source: {
                type: String,
                minLength: [2, 'Source must be at least 2 characters'],
                maxLength: [50, 'Source must be fewer than 50 characters'],
            },
            benificiary: {
                name: {
                    type: String,
                    minLength: [2, 'Benificiary name must be at least 2 characters'],
                    maxLength: [50, 'Benificiary name must be fewer than 50 characters'],
                },
                phone: {
                    countryCode: {
                        type: String,
                        maxLength: [5, 'Phone extension must be fewer than 5 characters'],
                        validate: {
                            validator: function (value) {
                                if (!value) return true
                                return /^\+\d+$/.test(value)
                            },
                            message: 'Phone extension must start with + and contain numbers only'
                        }
                    },
                    number: {
                        type: String,
                        minLength: [8, 'Phone number must be at least 8 characters'],
                        maxLength: [15, 'Phone number must be fewer than 15 characters'],
                        validate: {
                            validator: function (value) {
                                if (!value) return true
                                return /^\d+$/.test(value)
                            },
                            message: 'Phone number must contain digits only'
                        }
                    },
                    extension: {
                        type: String,
                        maxLength: [10, 'Phone extension must be fewer than 10 characters'],
                        validate: {
                            validator: function (value) {
                                if (!value) return true
                                return /^\d+$/.test(value)
                            },
                            message: 'Phone extension must contain digits only'
                        }
                    },
                }
            },
            followUp: {
                type: Date,
            },
            priority: {
                type: Number,
                min: [0, 'Priority must be at least 0'],
                default: 0,
            },
            convertedToLead: {
                isConverted: {
                    type: Boolean,
                    default: false,
                },
                companyLeadId: {
                    type: mongoose.Schema.Types.ObjectId,
                },
                at: {
                    type: Date,
                }
            },
            createdBy: {
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
                restoredAt: {
                    type: Date,
                    select: false,
                },
                restoredBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: `${tenantId}_users`,
                    select: false,
                }
            },
        },
        {
            timestamps: true,
            versionKey: false,
        },
    )

    prospectusSchema.index(
        { company: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    prospectusSchema.pre(/^find/, function () {
        this.where({ 'deleted.isDeleted': false })
    })

    return prospectusSchema
}

const prospectusModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_prospectuses`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createProspectusSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = prospectusModel
