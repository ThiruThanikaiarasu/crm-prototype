const organizationModel = require('../models/organization.model')
const organizationInviteModel = require('../models/organizationInvite.model')
const userModel = require('../models/user.model')
const { generateInviteToken } = require('../utils/token.util')
const { sendInviteEmail } = require('../utils/email.util')

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
        const OrganizationInvite = organizationInviteModel(tenantId)

        const userList = users.map(email => ({
            email,
            status: 'not_sent'
        }))

        const invites = await OrganizationInvite.insertMany(userList)

        inviteUsersToOrganization(tenantId, userList)

        return invites
    } catch (error) {
        console.error('Failed to invite user:', error)
        throw error
    }
}

const inviteUsersToOrganization = async (tenantId, users) => {
    try {
        if (!users || users.length === 0) return

        const User = userModel(tenantId)

        for (const user of users) {
            try {
                const password = Math.random().toString(36).slice(-8)

                await User.create({
                    firstName: user.firstName || '',
                    lastName: user.lastName || '',
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

const checkInviteStatus = async (tenantId, email) => {
    try {
        const User = userModel(tenantId)
        const OrganizationInvite = organizationInviteModel(tenantId)

        // Check if user already exists in organization
        const existingUser = await User.findOne({ email: email.toLowerCase() })

        if (existingUser) {
            return {
                canInvite: false,
                reason: 'User already exists in organization',
                status: 'exists',
                user: {
                    email: existingUser.email,
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    role: existingUser.role
                }
            }
        }

        // Check if invite already sent
        const existingInvite = await OrganizationInvite.findOne({ email: email.toLowerCase() })

        if (existingInvite) {
            return {
                canInvite: existingInvite.status === 'rejected' || existingInvite.status === 'not_sent',
                reason: existingInvite.status === 'pending' || existingInvite.status === 'sent'
                    ? 'Invite already sent and pending'
                    : existingInvite.status === 'accepted'
                    ? 'Invite already accepted'
                    : 'Can resend invite',
                status: existingInvite.status,
                invite: {
                    email: existingInvite.email,
                    status: existingInvite.status,
                    retryCount: existingInvite.retryCount,
                    lastTried: existingInvite.lastTried
                }
            }
        }

        // User can be invited
        return {
            canInvite: true,
            reason: 'User can be invited',
            status: 'not_invited'
        }
    } catch (error) {
        console.error('Error checking invite status:', error)
        throw error
    }
}

const sendInviteEmails = async (tenantId, members) => {
    try {
        const OrganizationInvite = organizationInviteModel(tenantId)
        const organization = await organizationModel.findOne({ tenantId })

        if (!organization) {
            throw new Error('Organization not found')
        }

        const results = {
            success: [],
            failed: [],
            alreadyInvited: []
        }

        for (const member of members) {
            try {
                const { email, role } = member

                // Check status first
                const status = await checkInviteStatus(tenantId, email)

                if (!status.canInvite) {
                    results.alreadyInvited.push({
                        email,
                        role,
                        reason: status.reason
                    })
                    continue
                }

                // Create or update invite record
                let invite = await OrganizationInvite.findOne({ email: email.toLowerCase() })

                if (!invite) {
                    invite = await OrganizationInvite.create({
                        email: email.toLowerCase(),
                        status: 'pending'
                    })
                } else {
                    invite.status = 'pending'
                    invite.retryCount += 1
                    invite.lastTried = new Date()
                    await invite.save()
                }

                // Generate invite token with role
                const inviteToken = generateInviteToken({
                    email: email.toLowerCase(),
                    tenantId,
                    inviteId: invite._id.toString(),
                    role
                })

                // Send email
                const emailSent = await sendInviteEmail(
                    email,
                    "Datastack",
                    inviteToken,
                    role
                )

                if (emailSent) {
                    invite.status = 'sent'
                    await invite.save()

                    results.success.push({
                        email,
                        role,
                        inviteId: invite._id
                    })
                } else {
                    invite.status = 'not_sent'
                    await invite.save()

                    results.failed.push({
                        email,
                        role,
                        reason: 'Failed to send email'
                    })
                }
            } catch (err) {
                console.error(`Error inviting ${member.email}:`, err)
                results.failed.push({
                    email: member.email,
                    role: member.role,
                    reason: err.message
                })
            }
        }

        return results
    } catch (error) {
        console.error('Error sending invite emails:', error)
        throw error
    }
}

const getOrganizationMembers = async (tenantId) => {
    try {
        const User = userModel(tenantId)

        // Get all users for this tenant, excluding password
        const members = await User.find({}).select('-password')

        return members
    } catch (error) {
        console.error('Error fetching organization members:', error)
        throw error
    }
}

const updateInvitedLinkStatus = async (tenantId, email) => {
    try {
        const OrganizationInvite = organizationInviteModel(tenantId)
        const invite = await OrganizationInvite.findOne({ email })
        if (!invite) {
            throw new Error('Invite not found')
        }
        invite.status = 'accepted'
        await invite.save()
    } catch (error) {
        console.error('Error updating invite status:', error)
        throw error
    }
}

module.exports = {
    getDomainFromEmail,
    checkIfOrganizationExists,
    createAdminAndOrganization,
    inviteUser,
    inviteUsersToOrganization,
    checkInviteStatus,
    sendInviteEmails,
    getOrganizationMembers,
    updateInvitedLinkStatus
}