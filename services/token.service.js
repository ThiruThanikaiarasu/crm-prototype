const {
    generateAccessToken,
    generateRefreshToken,
    setTokenCookie,
} = require('../utils/token.util')
const { storeRefreshToken } = require('./refreshToken.service')

const generateAndSetTokens = async (response, tenantId, userId, role) => {
    const accessToken = await generateAndSetAccessToken(
        response,
        tenantId,
        userId,
        role,
    )
    const refreshToken = await generateAndSetRefreshToken(
        response,
        userId,
        tenantId,
    )

    await storeRefreshToken(tenantId, { userId, refreshToken })
}

const generateAndSetAccessToken = async (response, tenantId, userId, role) => {
    const accessToken = generateAccessToken({
        tenantId,
        userId,
        role,
    })

    setTokenCookie(response, 'AccessToken', accessToken)

    return accessToken
}

const generateAndSetRefreshToken = async (response, userId, tenantId) => {
    const refreshToken = generateRefreshToken({
        userId,
        tenantId,
    })

    setTokenCookie(response, 'RefreshToken', refreshToken)

    return refreshToken
}

const clearAuthCookies = (response) => {
    clearTokenCookie(response, 'AccessToken')
    clearTokenCookie(response, 'RefreshToken')
}

const clearTokenCookie = (response, cookieName) => {
    response.clearCookie(cookieName, {
        httpOnly: true,
        secure: true,
        sameSite: 'None',
        path: '/'
    })
}

module.exports = {
    generateAndSetTokens,
    clearAuthCookies
}
