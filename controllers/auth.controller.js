const { validationResult } = require('express-validator')
const {
    findUserByEmail,
    registerUser,
    getTenantIdByEmail,
} = require('../services/auth.service')
const { generateAndSetTokens } = require('../services/token.service')
const { setResponseBody } = require('../utils/responseFormatter.util')
const bcrypt = require('bcryptjs')
const { ERROR_CODES } = require('../constants/error.constant')

const signup = async (request, response) => {
    const { firstName, lastName, email, password, role } = request.body

    const tenantId = 'abcd'

    try {
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

        const existingUser = await findUserByEmail(email, tenantId)
        if (existingUser) {
            return response
                .status(409)
                .send(
                    setResponseBody(
                        'Email already exists',
                        ERROR_CODES.EMAIL_ALREADY_EXISTS,
                        'email_exists',
                        null,
                    ),
                )
        }

        const createdUser = await registerUser({
            firstName,
            lastName,
            email,
            password,
            role,
            tenantId,
        })

        await generateAndSetTokens(
            response,
            createdUser.tenantId,
            createdUser._id,
            createdUser.role,
        )

        return response.status(201).send(
            setResponseBody('User registered successfully', null, {
                firstName: createdUser.firstName,
                lastName: createdUser.lastName,
                email: createdUser.email,
                role: createdUser.role,
            }),
        )
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null
                )
            )
    }
}

const login = async (request, response) => {
    const { email, password } = request.body

    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response
                .status(400)
                .send(
                    setResponseBody(
                        errors.array()[0].msg,
                        'validation_error',
                        null,
                    ),
                )
        }

        const tenantId = await getTenantIdByEmail(email)
        if (tenantId == null) {
            return response
                .status(404)
                .send(
                    setResponseBody(
                        'Your organization is not registered',
                        'organization_not_found',
                        null,
                    ),
                )
        }

        const existingUser = await findUserByEmail(email, tenantId)
        if (!existingUser) {
            return response
                .status(404)
                .send(
                    setResponseBody(
                        'Invalid email address',
                        'invalid_email',
                        null,
                    ),
                )
        }

        const validPassword = await bcrypt.compare(
            password,
            existingUser.password,
        )
        if (!validPassword) {
            return response
                .status(401)
                .send(
                    setResponseBody(
                        'Invalid password',
                        'invalid_password',
                        null,
                    ),
                )
        }

        await generateAndSetTokens(
            response,
            tenantId,
            existingUser._id,
            existingUser.role,
        )

        return response.status(200).send(
            setResponseBody('Logged in Successfully', null, {
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                role: existingUser.role,
            }),
        )
    } catch (error) {
        response
            .status(500)
            .send(setResponseBody(error.message, 'server_error', null))
    }
}

const refreshAccessToken = async (request, response) => {
    const { tenantId, userId, role } = request.user
    try {
        await generateAndSetTokens(response, tenantId, userId, role)

        return response
            .status(200)
            .send(
                setResponseBody(
                    'Access token refreshed successfully',
                    null,
                    null,
                ),
            )
    } catch (error) {
        console.log(error)
        return response
            .status(500)
            .send(setResponseBody(error.message, 'server_error', null))
    }
}

module.exports = {
    signup,
    login,
    refreshAccessToken,
}
