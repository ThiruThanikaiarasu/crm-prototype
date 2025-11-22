const jwt = require('jsonwebtoken')
const userModel = require('../models/user.model')
const { setResponseBody } = require('../utils/responseFormatter.util')
const refreshTokenModel = require('../models/refreshToken.model')
const {
    accessTokenSecret,
    refreshTokenSecret,
} = require('../configurations/env.config')

const parseCookies = (cookieString) => {
    return cookieString.split(';').reduce((cookies, cookie) => {
        const [key, value] = cookie.split('=').map((item) => item.trim())
        cookies[key] = value
        return cookies
    }, {})
}

const getCookiesFromHeader = (request, response) => {
    const cookieHeader = request.headers.cookie

    if (!cookieHeader) {
        return response
            .status(401)
            .send(
                setResponseBody(
                    'Authentication token missing',
                    'authentication_error',
                    null,
                ),
            )
    }

    return parseCookies(cookieHeader)
}

const verifyUser = async (request, response, next) => {
    try {
        const cookies = getCookiesFromHeader(request)

        if (!cookies?.AccessToken) {
            return response
                .status(401)
                .send(
                    setResponseBody(
                        'Access token missing',
                        'authentication_error',
                        null,
                    ),
                )
        }

        const accessToken = cookies.AccessToken

        let decoded
        try {
            decoded = jwt.verify(accessToken, accessTokenSecret)
        } catch (error) {
            return response
                .status(440)
                .send(
                    setResponseBody(
                        'Session expired',
                        'authentication_error',
                        null,
                    ),
                )
        }

        const { tenantId, userId, role } = decoded

        const User = userModel(tenantId)
        const existingUser = await User.findById(userId)

        if (!existingUser) {
            return response
                .status(401)
                .send(
                    setResponseBody(
                        'User not found',
                        'authentication_error',
                        null,
                    ),
                )
        }

        request.user = { userId, tenantId, role }
        return next()
    } catch (error) {
        return response
            .status(500)
            .send(setResponseBody(error.message, 'server_error', null))
    }
}

const allowRoles = (...allowedRoles) => {
    return (request, response, next) => {
        if (!request.user) {
            return response
                .status(401)
                .send(
                    setResponseBody(
                        'Unauthorized',
                        'authentication_error',
                        null,
                    ),
                )
        }

        if (!allowedRoles.includes(request.user.role)) {
            return response
                .status(403)
                .send(
                    setResponseBody(
                        'Forbidden - insufficient permission',
                        'authorization_error',
                        null,
                    ),
                )
        }

        next()
    }
}

const getRefreshToken = async (request, response, next) => {
    const cookies = getCookiesFromHeader(request)

    const refreshToken = cookies.RefreshToken

    if (!refreshToken) {
        return response
                .status(401)
                .send(
                    setResponseBody(
                        'Access token missing',
                        'authentication_error',
                        null,
                    ),
                )
    }

    let decode
    try {
        decode = jwt.verify(refreshToken, refreshTokenSecret)
    } catch (error) {
        return response
            .status(440)
            .send(
                setResponseBody(
                    'Refresh token expired',
                    'authentication_error',
                    null,
                ),
            )
    }

    const { tenantId, userId } = decode

    const RefreshToken = refreshTokenModel(tenantId)
    const refreshFromDb = await RefreshToken.findOneAndDelete({
        token: refreshToken,
    })

    if (!refreshFromDb) {
        return response
            .status(403)
            .send(
                setResponseBody(
                    'Invalid refresh token',
                    'authentication_error',
                    null,
                ),
            )
    }

    const User = userModel(tenantId)
    const existingUser = await User.findById(userId)

    if (!existingUser) {
        return response
            .status(401)
            .send(
                setResponseBody('User not found', 'authentication_error', null),
            )
    }
    const role = existingUser.role
    request.user = {
        userId,
        tenantId,
        role,
    }
    return next()
}

module.exports = {
    allowRoles,
    verifyUser,
    getRefreshToken,
}
