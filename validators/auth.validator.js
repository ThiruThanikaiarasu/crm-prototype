const {
    validateFirstName,
    validateLastName,
    validateEmail,
    validatePassword,
} = require('./commonAuth.validator')

const validateSignupPayload = [
    validateFirstName(),
    validateLastName(),
    validateEmail(),
    validatePassword(),
]

const validateLoginPayload = [validateEmail()]

module.exports = {
    validateSignupPayload,
    validateLoginPayload,
}
