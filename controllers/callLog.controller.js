const { validationResult } = require("express-validator")
const { ERROR_CODES } = require("../constants/error.constant")
const { createCallLog, getAllCallLogs, getCallLogById, updateCallLog, deleteCallLogById, searchCompanies, searchLeadsByCompany } = require("../services/callLog.service")
const { setResponseBody } = require("../utils/responseFormatter.util")
const NotFoundError = require("../errors/NotFoundError")

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
            lead,
            companyId,
            leadName,
            outcome,
            followUp,
            remarks,
            callStartTime,
            callDuration
        } = request.body

        const { tenantId, userId } = request.user

        const callLog = await createCallLog(tenantId, {
            lead,
            companyId,
            leadName,
            outcome,
            followUp,
            remarks,
            callStartTime,
            callDuration,
            owner: userId,
        })

        return response.status(201).send(
            setResponseBody(
                'Call log created successfully',
                null,
                ERROR_CODES.CALL_LOG_CREATED,
                callLog,
            ),
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

const getAll = async (request, response) => {
    try {
        const { tenantId } = request.user

        const {
            page,
            limit,
            lead,
            outcome,
            followUp,
            remarks,
            sort,
            order,
        } = request.query

        const callLogs = await getAllCallLogs(tenantId, {
            page,
            limit,
            lead,
            outcome,
            followUp,
            remarks,
            sort,
            order,
        })

        return response.status(201).send(
            setResponseBody(
                'Call logs fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLogs,
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

const getACallLog = async (request, response) => {
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

        const callLog = await getCallLogById(tenantId, id)

        if (!callLog) {
            throw new NotFoundError(404, 'Call log not found', ERROR_CODES.CALL_LOG_NOT_FOUND, 'not_found')
        }

        return response.status(200).send(
            setResponseBody(
                'Call log fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLog,
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

const updateACallLog = async (request, response) => {
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

        const callLogs = await updateCallLog(tenantId, id, request.body)

        return response.status(200).send(
            setResponseBody(
                'Call log updated successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLogs,
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

const deleteACallLog = async (request, response) => {
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

        const callLog = await deleteCallLogById(tenantId, userId, id)

        return response.status(200).send(
            setResponseBody(
                'Call log deleted successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLog,
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

const searchCompaniesHandler = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { search, page, limit } = request.query

        const result = await searchCompanies(tenantId, { search, page, limit })

        return response.status(200).send(
            setResponseBody(
                'Companies fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                result,
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

const searchLeadsByCompanyHandler = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { companyId } = request.query

        const leads = await searchLeadsByCompany(tenantId, companyId)

        return response.status(200).send(
            setResponseBody(
                leads ? 'Leads fetched successfully' : 'No leads found for this company',
                null,
                ERROR_CODES.SUCCESS,
                leads,
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
    getACallLog,
    updateACallLog,
    deleteACallLog,
    searchCompaniesHandler,
    searchLeadsByCompanyHandler,
}
