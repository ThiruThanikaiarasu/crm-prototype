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

module.exports = {
    generateAndSetTokens,
}
