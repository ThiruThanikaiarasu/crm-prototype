const validator = require('validator')
const dns = require('dns').promises

const validateEmail = async (email) => {
    if (!validator.isEmail(email)) {
        console.log("Invalid email format" + false)
        return false
    }

    const domain = email.split('@')[1]

    try {
        const mx = await dns.resolveMx(domain)
        console.log(mx)

        if (!mx || mx.length === 0) {
            console.log("MX record not found for domain" + false)
            return false
        }

        console.log("MX record found for domain" + true)
        return true
    } catch (err) {
        console.log("DNS lookup failed" + false)
        return false
    }
}

module.exports = {
    validateEmail
}