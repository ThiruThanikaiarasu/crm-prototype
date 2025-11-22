const organizationModel = require('../models/organization.model')
const userModel = require('../models/user.model')

const registerUser = async ({
    firstName,
    lastName,
    email,
    password,
    role,
    tenantId,
}) => {
    const User = userModel(tenantId)

    return await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId,
    })
}

const findUserByEmail = async (email, tenantId) => {
    const User = userModel(tenantId)
    return await User.findOne({ email }).select('+password')
}

const getTenantIdByEmail = async (email) => {
    const domain = getDomainFromEmail(email)

    const organization = await organizationModel.findOne({ domain })
    if (!organization) {
        return null
    }

    return organization.tenantId
}

const getDomainFromEmail = (email) => {
    return email.split('@')[1].toLowerCase()
}

module.exports = {
    registerUser,
    findUserByEmail,
    getTenantIdByEmail,
}
