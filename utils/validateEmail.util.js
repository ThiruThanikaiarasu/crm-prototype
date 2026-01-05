const validator = require('validator')
const dns = require('dns').promises

const validateEmail = async (email) => {
    if (!validator.isEmail(email)) {
        return false
    }

    const domain = email.split('@')[1]

    try {
        const mx = await dns.resolveMx(domain)

        if (!mx || mx.length === 0) {
            return false
        }

        return true
    } catch (err) {
        return false
    }
}

module.exports = {
    validateEmail
}