const mongoose = require('mongoose')

const createLeadSchema = (tenantId) => {
    const leadSchema = new mongoose.Schema(
        {
            company: {
                type: String,
                required: [true, 'Company is a mandatory field'],
                minLength: [2, 'Company name must be at least 2 characters'],
                maxLength: [100, 'Company name must be fewer than 100 characters'],
            },
            contact: {
                type: String,
                required: [true, 'Contact is a mandatory field'],
                minLength: [2, 'Contact name must be at least 2 characters'],
                maxLength: [50, 'Contact name must be fewer than 50 characters'],
            },
            phone: {
                extension: {
                    type: String,
                    maxLength: [5, 'Phone extension must be fewer than 5 characters'],
                    validate: {
                        validator: function (value) {
                            if (!value) return true
                            return /^\+\d+$/.test(value)  // must start with + then digits
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
                            return /^\d+$/.test(value)   // digits only
                        },
                        message: 'Phone number must contain digits only'
                    }
                },
            },
            email: {
                type: String,
                required: [true, 'Email is a mandatory field'],
                match: [
                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    'Please fill a valid email address',
                ],
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
        },
        {
            timestamps: true,
        },
    )

    leadSchema.index(
        { company: 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

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
