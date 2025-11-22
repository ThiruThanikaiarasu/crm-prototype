const jwt = require('jsonwebtoken')
const {
    accessTokenSecret,
    refreshTokenSecret,
    accessTtl,
    refreshTtl,
} = require('../configurations/env.config')

const ACCESS_TOKEN_TTL = accessTtl || '15m'
const REFRESH_TOKEN_TTL = refreshTtl || '90d'

const options = {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
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

const setTokenCookie = (response, cookieName, token) => {
    response.cookie(cookieName, token, options)
}

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookie,
}
