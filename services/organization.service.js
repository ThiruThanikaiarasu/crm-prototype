const organizationModel = require('../models/organization.model')
const userModel = require('../models/user.model')

const getDomainFromEmail = (email) => {
    return email.split('@')[1]
}

const checkIfOrganizationExists = async (domain) => {
    return organizationModel.findOne({ domain })
}

const createAdminAndOrganization = async ({ title, email, firstName, lastName, password }) => {

    const domain = getDomainFromEmail(email)

    const tenantId = domain.toLowerCase().replace(/[^a-z0-9]/g, '-')

    const User = userModel(tenantId)
    const adminUser = await User.create({
        firstName,
        lastName,
        email,
        password,
        role: 'super_admin',
        tenantId: tenantId
    })

    const organization = await organizationModel.create({
        title,
        domain,
        tenantId,
        admin: adminUser._id
    })

    return {
        organization,
        admin: adminUser
    }
}

module.exports = {
    getDomainFromEmail,
    checkIfOrganizationExists,
    createAdminAndOrganization,
}
