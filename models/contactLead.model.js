const mongoose = require('mongoose')

const createContactLeadSchema = (tenantId) => {
    const contactLeadSchema = new mongoose.Schema(
        {
            name: {
                type: String,
                required: [true, 'Contact Name is a mandatory field'],
                minLength: [2, 'Name must be at least 2 characters'],
                maxLength: [50, 'Name must be fewer than 50 characters'],
            },
            phone: {
                extension: {
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
            },
            email: {
                type: String,
                match: [
                    /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                    'Please fill a valid email address',
                ],
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

    contactLeadSchema.pre(/^find/, function() {
        this.where({'deleted.isDeleted': false})
    })

    return contactLeadSchema
}

const contactLeadModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_contactLeads`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createContactLeadSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = contactLeadModel