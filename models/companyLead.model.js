const mongoose = require('mongoose')

const createCompanyLeadSchema = (tenantId) => {
    const companyLeadSchema = new mongoose.Schema(
        {
            name: {
                type: String,
                require: [true, 'Company name is a mandatory field'],
                minLength: [2, 'Company name must be at least 2 characters'],
                maxLength: [100, 'Company name must be fewer than 100 characters'],
                trim: true,
            },
            website: {
                type: String,
                trim: true,
                match: [
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                    'Please fill a valid website address',
                ],
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
            socialProfile: {
                type: String,
                trim: true,
                match: [
                    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)/,
                    'Please fill a valid website address',
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
        }
    )

    companyLeadSchema.index(
        { name: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    companyLeadSchema.pre(/^find/, function() {
        this.where({'deleted.isDeleted': false})
    })

    return companyLeadSchema
}

const companyLeadModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_companyLeads`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createCompanyLeadSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = companyLeadModel