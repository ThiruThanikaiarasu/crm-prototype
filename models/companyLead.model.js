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
                    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,10}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
                    'Please fill a valid website address',
                ],
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
                    /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{2,10}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
                    'Please fill a valid website address',
                ],
            },
            serviceType: {
                type: String,
                enum: {
                    values: ['hiring_service', 'peo_and_eor', 'digital_marketing', 'digital_solutions'],
                    message: '{VALUE} is not a valid service name',
                },
            },
            address: {
                door: {
                    type: String,
                    required: true,
                    match: [
                        /^[a-zA-Z0-9\/\- ]{1,20}$/,
                        'Door number can contain letters, numbers, space, / or - (max 20 characters)'
                    ]
                },

                street: {
                    type: String,
                    required: true,
                    match: [
                        /^[a-zA-Z0-9.,\- ]{3,100}$/,
                        'Street name must be 3–100 characters and can include letters, numbers, space, comma, dot or hyphen'
                    ]
                },

                area: {
                    type: String,
                    required: true,
                    match: [
                        /^[a-zA-Z0-9.,\- ]{2,100}$/,
                        'Area must be 2–100 characters'
                    ]
                },

                city: {
                    type: String,
                    required: true,
                    match: [
                        /^[a-zA-Z ]{2,50}$/,
                        'City should contain only letters and spaces (2–50 characters)'
                    ]
                },

                pincode: {
                    type: String,
                    required: true,
                    match: [
                        /^[1-9][0-9]{4}$/,
                        'Pincode must be a valid 5-digit Saudi postal code'
                    ]
                },
                location: {
                    latitude: {
                        type: Number,
                        required: true,
                        min: [-90, 'Latitude must be between -90 and 90'],
                        max: [90, 'Latitude must be between -90 and 90']
                    },
                    longitude: {
                        type: Number,
                        required: true,
                        min: [-180, 'Longitude must be between -180 and 180'],
                        max: [180, 'Longitude must be between -180 and 180']
                    }
                },
                shortAddress: {
                    type: String,
                    required: true,
                    match: [
                        /^[A-Z]{4}[0-9]{4}$/,
                        'Short address must be 8 characters: 4 uppercase letters followed by 4 digits (e.g., RRRD2929)'
                    ]
                }
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
        }
    )

    companyLeadSchema.index(
        { name: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    companyLeadSchema.pre(/^find/, function () {
        this.where({ 'deleted.isDeleted': false })
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