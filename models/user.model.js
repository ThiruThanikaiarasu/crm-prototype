const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const createUserSchema = (tenantId) => {
    const userSchema = new mongoose.Schema(
        {
            firstName: {
                type: String,
                required: [true, 'First name is a mandatory field'],
                maxLength: [25, 'First name length must be less than 25'],
                minLength: [2, 'First name length must be greater than 2'],
            },
            lastName: {
                type: String,
                required: [true, 'Last name must be a mandatory filed'],
                maxLength: [25, 'Last name length must be less than 25'],
                minLength: [1, 'Last name length must be greater than 1'],
            },
            email: {
                type: String,
                required: [true, 'Email is a mandatory field'],
                unique: true,
                lowercase: true,
            },
            password: {
                type: String,
                required: [true, 'Password is a mandatory field'],
                select: false,
                minLength: [1, 'Password must be greater than 8 characters'],
                maxLength: [25, 'Password must be less than 25 characters'],
            },
            profileImage: {
                type: String,
            },
            role: {
                type: String,
                enum: ['super_admin', 'admin', 'employee'],
                default: 'employee',
            },
            tenantId: {
                type: String,
                select: false,
                required: function () {
                    return this.role === 'user'
                },
            },
        },
        {
            timestamps: true,
        },
    )

    userSchema.pre('save', async function () {
        if (!this.isModified('password')) return

        const salt = await bcrypt.genSalt(10)
        this.password = await bcrypt.hash(this.password, salt)
    })

    return userSchema
}

const userModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_users`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createUserSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = userModel
