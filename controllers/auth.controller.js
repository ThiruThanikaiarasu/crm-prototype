const { validationResult } = require('express-validator')
const {
    findUserByEmail,
    registerUser,
    getTenantIdByEmail,
} = require('../services/auth.service')
const { generateAndSetTokens, clearAuthCookies } = require('../services/token.service')
const { setResponseBody } = require('../utils/responseFormatter.util')
const bcrypt = require('bcryptjs')
const { ERROR_CODES } = require('../constants/error.constant')
const { getCookiesFromHeader } = require('../middlewares/auth.middleware')

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
            setResponseBody(
                'User registered successfully',
                ERROR_CODES.USER_REGISTERED,
                null,
                {
                    firstName: createdUser.firstName,
                    lastName: createdUser.lastName,
                    email: createdUser.email,
                    role: createdUser.role,
                }
            ),
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
                        ERROR_CODES.VALIDATION_ERROR,
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
                        ERROR_CODES.ORGANIZATION_NOT_FOUND,
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
                        ERROR_CODES.INVALID_CREDENTIALS,
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
                        ERROR_CODES.INVALID_CREDENTIALS,
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
            setResponseBody(
                'Logged in Successfully',
                null,
                ERROR_CODES.LOGIN_SUCCESS,
                {
                    firstName: existingUser.firstName,
                    lastName: existingUser.lastName,
                    email: existingUser.email,
                    role: existingUser.role,
                }
            ),
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

const refreshAccessToken = async (request, response) => {
    const { tenantId, userId, role } = request.user
    try {
        await generateAndSetTokens(response, tenantId, userId, role)

        return response
            .status(200)
            .send(
                setResponseBody(
                    'Access token refreshed successfully',
                    ERROR_CODES.TOKEN_REFRESHED,
                    null,
                    null,
                ),
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

const logout = async (request, response) => {
    try {
        const cookies = getCookiesFromHeader(request, response)

        if (!cookies) {
            return response
                    .status(401)
                    .send(
                        setResponseBody(
                            'Access token missing',
                            ERROR_CODES.AUTH_TOKEN_MISSING,
                            'authentication_error',
                            null,
                        )
                    )
        }

        clearAuthCookies(response)

        return response
            .status(200)
            .send(
                setResponseBody(
                    'Logged out successfully',
                    ERROR_CODES.LOGOUT_SUCCESS,
                    null,
                    null,
                ),
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

module.exports = {
    signup,
    login,
    refreshAccessToken,
    logout
}
