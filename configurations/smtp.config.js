const nodemailer = require('nodemailer')
const { emailUser, emailPass } = require('./env.config')

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: emailUser,
        pass: emailPass,
    }
})

module.exports = transporter