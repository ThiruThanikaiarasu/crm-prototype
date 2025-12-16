const organizationModel = require('../models/organization.model')
const organizationInviteModel = require('../models/organizationInvite.model')
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

const inviteUser = async (tenantId, users) => {
    try {
        const userList = users.map(email => ({
            email,
        }))
        const user = await organizationInviteModel.insertMany(userList)
        inviteUsersToOrganization(tenantId, userList)
        return user
    } catch (error) {
        console.error('Failed to invite user:', error)
        throw error
    }
}

const inviteUsersToOrganization = async (tenantId, users) => {
    try {
        if (!users || users.length === 0) return

        console.log(`Starting to invite ${users.length} users for tenant ${tenantId}`)

        const User = userModel(tenantId)

        for (const user of users) {
            try {
                const password = Math.random().toString(36).slice(-8)

                await User.create({
                    firstName: user.firstName,
                    lastName: user.lastName,
                    email: user.email,
                    password: password,
                    role: 'employee',
                    tenantId: tenantId
                })

                console.log(`Successfully invited user: ${user.email}`)
            } catch (err) {
                console.error(`Failed to invite user ${user.email}:`, err.message)
            }
        }
        console.log('Finished processing user invitations')
    } catch (error) {
        console.error('Critical error in background invitation process:', error)
    }
}

module.exports = {
    getDomainFromEmail,
    checkIfOrganizationExists,
    createAdminAndOrganization,
    inviteUser,
    inviteUsersToOrganization
}
