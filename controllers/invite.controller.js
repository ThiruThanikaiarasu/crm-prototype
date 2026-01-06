// invite.controller.js
const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const { verifyInviteToken } = require('../utils/token.util')

const verifyInvite = async (request, response) => {
    try {
        const { token } = request.query

        if (!token) {
            return response.status(400).send(
                setResponseBody(
                    'Invite token is required',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error',
                    null
                )
            )
        }

        const verification =  await verifyInviteToken(token)
        if (!verification.valid) {
            return response.status(401).send(
                setResponseBody(
                  'Invalid or expired invite token',
                    ERROR_CODES.INVALID_TOKEN,
                    'invalid_token',
                    { error: verification.error }
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Invite token is valid',
                null,
                ERROR_CODES.SUCCESS,
                {
                    email: verification.data.email,
                    tenantId: verification.data.tenantId,
                    role: verification.data.role,
                    method: "viaMagicLink"
                }
            )
        )
    } catch (error) {
        console.log(error)
        return response.status(error.statusCode || 500).send(
            setResponseBody(
                error.message || 'Internal Server Error',
                error.errorCode || ERROR_CODES.INTERNAL_SERVER_ERROR,
                error.errorType || 'internal_server_error',
                null
            )
        )
    }
}

module.exports = {
    verifyInvite,
}