const jwt = require('jsonwebtoken')
const {
    accessTokenSecret,
    refreshTokenSecret,
    accessTtl,
    refreshTtl,
} = require('../configurations/env.config')

const ACCESS_TOKEN_TTL = accessTtl || '15m'
const REFRESH_TOKEN_TTL = refreshTtl || '90d'
const INVITE_TOKEN_TTL = '7d' // Invite links valid for 7 days

const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 1000 * 60 * 60 * 24 * 90,
}

const generateAccessToken = ({ tenantId, userId, role }) => {
    return jwt.sign({ tenantId, userId, role }, accessTokenSecret, {
        expiresIn: ACCESS_TOKEN_TTL,
    })
}

const generateRefreshToken = ({ userId, tenantId }) => {
    return jwt.sign({ userId, tenantId }, refreshTokenSecret, {
        expiresIn: REFRESH_TOKEN_TTL,
    })
}

const generateInviteToken = ({ email, tenantId, inviteId, role }) => {
    return jwt.sign(
        {
            email,
            tenantId,
            inviteId,
            role,
            type: 'invite'
        },
        accessTokenSecret, // Use same secret or create a separate one
        {
            expiresIn: INVITE_TOKEN_TTL,
        }
    )
}

const verifyInviteToken = (token) => {
    try {
        const decoded = jwt.verify(token, accessTokenSecret)

        if (decoded.type !== 'invite') {
            throw new Error('Invalid token type')
        }

        return {
            valid: true,
            data: decoded
        }
    } catch (error) {
        return {
            valid: false,
            error: error.message
        }
    }
}

const setTokenCookie = (response, cookieName, token) => {
    response.cookie(cookieName, token, options)
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    generateInviteToken,
    verifyInviteToken,
    setTokenCookie,
}