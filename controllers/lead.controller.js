const { validationResult } = require('express-validator')
const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const { createLead, getAllLeads, getLeadById, updateLeadById, deleteLeadById } = require('../services/lead.service')

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

        const leadObj = lead.toObject()
        const { deleted, ...sanitizedLead } = leadObj

        return response.status(201).send(
            setResponseBody(
                'Lead created successfully',
                null,
                ERROR_CODES.CREATED,
                sanitizedLead,
            ),
        )
    } catch (error) {
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

const getAll = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            company,
            contact,
            status,
            source,
            sort,
            order,
            followUp,
        } = request.query

        const result = await getAllLeads(tenantId, {
            page,
            limit,
            contact,
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
        console.log(error)
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

const getALeadById = async (request, response) => {
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

        const { tenantId } = request.user
        const { id } = request.params

        const lead = await getLeadById(tenantId, id)

        if (!lead) {
            throw new NotFoundError(404, 'Lead not found', ERROR_CODES.LEAD_NOT_FOUND, 'not_found')
        }

        return response.status(200).send(
            setResponseBody(
                'Lead fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                lead,
            ),
        )
    } catch (error) {
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

const updateALeadById = async (request, response) => {
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

        const { tenantId } = request.user
        const { id } = request.params

        const lead = await updateLeadById(tenantId, id, request.body)

        return response.status(200).send(
            setResponseBody(
                'Lead updated successfully',
                null,
                ERROR_CODES.SUCCESS,
                lead,
            ),
        )
    } catch (error) {
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

const deleteALeadById = async (request, response) => {
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

        const { tenantId, userId } = request.user
        const { id } = request.params

        const lead = await deleteLeadById(tenantId, userId, id)

        return response.status(200).send(
            setResponseBody(
                'Lead deleted successfully',
                null,
                ERROR_CODES.SUCCESS,
                null,
            ),
        )
    } catch (error) {
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
    create,
    getAll,
    getALeadById,
    updateALeadById,
    deleteALeadById
}
