const { validationResult } = require('express-validator')
const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const { createLead, getAllLeads } = require('../services/lead.service')

const create = async (request, response) => {
    try {
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

        const {
            company,
            contact,
            phone,
            email,
            status,
            source,
            followUp,
        } = request.body

        const { tenantId, userId } = request.user

        const lead = await createLead({
            company,
            contact,
            phone,
            email,
            status,
            source,
            followUp,
            owner: userId,
            tenantId,
        })

        return response.status(201).send(
            setResponseBody(
                'Lead created successfully',
                null,
                ERROR_CODES.CREATED,
                lead,
            ),
        )
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null,
                ),
            )
    }
}

const getAll = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            company,
            status,
            source,
            sort,
            order,
            followUp,
        } = request.query

        const result = await getAllLeads(tenantId, {
            page,
            limit,
            company,
            status,
            source,
            sort,
            order,
            followUp,
        })

        return response.status(200).send(
            setResponseBody(
                'Leads fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                result,
            ),
        )
    } catch (error) {
        response
            .status(500)
            .send(
                setResponseBody(
                    error.message,
                    ERROR_CODES.SERVER_ERROR,
                    'server_error',
                    null,
                ),
            )
    }
}

module.exports = {
    create,
    getAll,
}
