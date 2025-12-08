const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const { checkIfOrganizationExists, createAdminAndOrganization, getDomainFromEmail } = require('../services/organization.service')

const verifyOrganization = async (request, response) => {
    try {
        const { email } = request.body

        if (null == email || "" == email.trim()) {
            return response.status(400).send(
                setResponseBody(
                    'Please fill mandatory field',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error',
                    null
                )
            )
        }

        const domain = getDomainFromEmail(email)

        const organizationExists = await checkIfOrganizationExists(domain)
        if (organizationExists) {
            return response.status(409).send(
                setResponseBody(
                    'Organization already exists',
                    ERROR_CODES.ORGANIZATION_ALREADY_EXISTS,
                    'organization_exists',
                    {
                        organizationExists: true
                    }
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Organization verification result',
                null,
                ERROR_CODES.SUCCESS,
                {
                    organizationExists: organizationExists ? true : false
                }
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

const createOrganization = async (request, response) => {
    try {
        const { title, email, firstName, lastName, password } = request.body

        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response
                .status(400)
                .send(
                    setResponseBody(
                        errors.array()[0].msg,
                        ERROR_CODES.VALIDATION_ERROR,
                        'validation_error',
                        null,
                    ),
                )
        }

        const result = await createAdminAndOrganization({ title, email, firstName, lastName, password })

        return response.status(201).send(
            setResponseBody(
                'Organization created successfully',
                null,
                ERROR_CODES.ORGANIZATION_REGISTERED,
                result
            )
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.SERVER_ERROR,
                'server_error',
                null
            )
        )
    }
}

module.exports = {
    verifyOrganization,
    createOrganization
}
