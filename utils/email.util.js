const path = require('path')
const fs = require('fs')

const transporter = require('../configurations/smtp.config')
const { emailUser } = require('../configurations/env.config')
const envConfig = require('../configurations/env.config')

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

    return sendEmail(to, subject, template, attachments)
}

const sendInviteEmail = (to, organizationName, inviteToken, role) => {
    try {
        let template = fs.readFileSync(path.join(__dirname, '../templates', 'inviteTemplate.html'), 'utf-8')

        // Replace placeholders
        const inviteLink = `${envConfig.corsOriginUrl || 'http://localhost:3000'}/invite/accept?token=${inviteToken}`

        const roleDisplayNames = {
            'super_admin': 'Super Admin',
            'admin': 'Admin',
            'employee': 'Employee'
        }

        template = template
            .replace(/{{organizationName}}/g, organizationName)
            .replace(/{{inviteLink}}/g, inviteLink)
            .replace(/{{email}}/g, to)
            .replace(/{{role}}/g, roleDisplayNames[role] || role)

        const attachments = [
            {
                filename: 'logo.png',
                path: path.join(__dirname, '../assets/images/opportune_logo_png.png'),
                cid: 'logo',
            },
        ]

        return sendEmail(to, `You're invited to join ${organizationName}`, template, attachments)
    } catch (error) {
        console.error('Error preparing invite email:', error)
        throw error
    }
}

const sendEmail = (to, subject, template, attachments) => {
    return new Promise((resolve, reject) => {
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
                    console.error(`Failed to send email to ${to}:`, error)
                    reject(error)
                } else {
                    console.log(`Email sent successfully to ${to}`)
                    resolve(true)
                }
            })
        } catch (error) {
            console.error('Error in sendEmail:', error)
            reject(error)
        }
    })
}

module.exports = {
    sendOTP,
    sendInviteEmail,
    sendEmail
}