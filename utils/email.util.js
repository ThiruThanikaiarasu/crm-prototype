const path = require('path')
const fs = require('fs')

const transporter = require('../configurations/smtp.config')
const { emailUser } = require('../configurations/env.config')

const sendOTP = (to, subject, otp) => {
    let template = fs.readFileSync(path.join(__dirname, '../templates', 'otpTemplate.html'), 'utf-8')
    template = template.replace('{{otp}}', otp)

    const attachments = [
        {
            filename: 'logo.png',
            path: path.join(__dirname, '../assets/images/opportune_logo_png.png'),
            cid: 'logo',
        },
    ]

    sendEmail(to, subject, template, attachments)
}

const sendEmail = (to, subject, template, attachments) => {
    try {
        const mailOptions = {
            from: emailUser,
            to,
            subject,
            html: template,
            attachments
        }

        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                throw error
            }
            if (info) {
                console.log(`Email sent successfully to ${to}`)
            }
        })
    } catch (error) {
        throw error
    }
}

sendOTP('thiruarasurani@gmail.com', 'OTP', '1234')