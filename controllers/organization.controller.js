const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const {
    checkIfOrganizationExists,
    createAdminAndOrganization,
    getDomainFromEmail,
    inviteUsersToOrganization,
    inviteUser,
    checkInviteStatus,
    sendInviteEmails,
    getOrganizationMembers
} = require('../services/organization.service')
const { validateEmail } = require('../utils/validateEmail.util')
const { validationResult } = require('express-validator')

const verifyOrganization = async (request, response) => {
    try {
        const { email } = request.body

        if (null == email || "" == email.trim()) {
            return response.status(400).send(
                setResponseBody(
                    'Please fill mandatory field',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error',
                    null
                )
            )
        }

        const isValidEmail = await validateEmail(email)
        if (!isValidEmail) {
            return response.status(422).send(
                setResponseBody(
                    'Unable to verify this email address. Please provide a valid one.',
                    ERROR_CODES.NOT_AN_VALID_EMAIL,
                    'validation_error',
                    null
                )
            )
        }

        const domain = getDomainFromEmail(email)

        const organizationExists = await checkIfOrganizationExists(domain)
        if (organizationExists) {
            return response.status(409).send(
                setResponseBody(
                    'Organization already exists',
                    ERROR_CODES.ORGANIZATION_ALREADY_EXISTS,
                    'organization_exists',
                    {
                        organizationExists: true
                    }
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Organization verification result',
                null,
                ERROR_CODES.SUCCESS,
                {
                    organizationExists: organizationExists ? true : false
                }
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

const createOrganization = async (request, response) => {
    try {
        const { title, firstName, lastName, email, password, invitedUsers } = request.body

        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response
                .status(400)
                .send(
                    setResponseBody(
                        errors.array()[0].msg,
                        ERROR_CODES.VALIDATION_ERROR,
                        'validation_error',
                        null,
                    ),
                )
        }

        const result = await createAdminAndOrganization({ title, email, firstName, lastName, password })

        const organizationInvite = await inviteUser(result.organization.tenantId, invitedUsers)
        if (!organizationInvite) {
            return response.status(500).send(
                setResponseBody(
                    'Failed to invite users',
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null
                )
            )
        }
        return response.status(201).send(
            setResponseBody(
                'Organization created successfully',
                null,
                ERROR_CODES.ORGANIZATION_REGISTERED,
                result
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

const inviteStatus = async (request, response) => {
    try {
        const { email } = request.query
        const { tenantId } = request.user // Assuming you have auth middleware that sets user

        if (!email || email.trim() === '') {
            return response.status(400).send(
                setResponseBody(
                    'Email is required',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error',
                    null
                )
            )
        }

        const isValidEmail = await validateEmail(email)
        if (!isValidEmail) {
            return response.status(422).send(
                setResponseBody(
                    'Invalid email address',
                    ERROR_CODES.NOT_AN_VALID_EMAIL,
                    'validation_error',
                    null
                )
            )
        }

        const status = await checkInviteStatus(tenantId, email)

        return response.status(200).send(
            setResponseBody(
                'Invite status retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                status
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

const inviteUsers = async (request, response) => {
    try {
        const { members } = request.body
        const { tenantId } = request.user // From auth middleware

        if (!members || !Array.isArray(members) || members.length === 0) {
            return response.status(400).send(
                setResponseBody(
                    'Members array is required and must not be empty',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error',
                    null
                )
            )
        }

        // Validate all members
        for (const member of members) {
            if (!member.email || !member.role) {
                return response.status(400).send(
                    setResponseBody(
                        'Each member must have email and role',
                        ERROR_CODES.VALIDATION_ERROR,
                        'validation_error',
                        null
                    )
                )
            }

            const isValid = await validateEmail(member.email)
            if (!isValid) {
                return response.status(422).send(
                    setResponseBody(
                        `Invalid email address: ${member.email}`,
                        ERROR_CODES.NOT_AN_VALID_EMAIL,
                        'validation_error',
                        null
                    )
                )
            }

            const validRoles = ['super_admin', 'admin', 'employee']
            if (!validRoles.includes(member.role)) {
                return response.status(400).send(
                    setResponseBody(
                        `Invalid role: ${member.role}. Must be one of: ${validRoles.join(', ')}`,
                        ERROR_CODES.VALIDATION_ERROR,
                        'validation_error',
                        null
                    )
                )
            }
        }

        const result = await sendInviteEmails(tenantId, members)

        return response.status(200).send(
            setResponseBody(
                'Invitations sent successfully',
                null,
                ERROR_CODES.SUCCESS,
                result
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

const getMembers = async (request, response) => {
    try {
        const { tenantId } = request.user // From auth middleware

        const members = await getOrganizationMembers(tenantId)

        return response.status(200).send(
            setResponseBody(
                'Members retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                {
                    members,
                    count: members.length
                }
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

module.exports = {
    verifyOrganization,
    createOrganization,
    inviteStatus,
    inviteUsers,
    getMembers
}