const dotenv = require('dotenv')
dotenv.config()

const required = [
    'DB_URI',
    'JWT_ACCESS_SECRET',
    'JWT_REFRESH_SECRET',
    'ACCESS_TOKEN_TTL',
    'REFRESH_TOKEN_TTL',
]

required.forEach((variable) => {
    if (!process.env[variable]) {
        console.error(`Missing env: ${variable}`)
        process.exit(1)
    }
})

module.exports = {
    nodeEnv: process.env.NODE_ENV || 'development',
    dbUri: process.env.DB_URI,
    accessTokenSecret: process.env.JWT_ACCESS_SECRET,
    refreshTokenSecret: process.env.JWT_REFRESH_SECRET,
    accessTtl: process.env.ACCESS_TOKEN_TTL,
    refreshTtl: process.env.REFRESH_TOKEN_TTL,
}
