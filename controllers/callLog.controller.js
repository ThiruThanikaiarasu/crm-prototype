const { validationResult } = require("express-validator")
const { ERROR_CODES } = require("../constants/error.constant")
const { createCallLog, getAllCallLogs, getCallLogById, updateCallLog, deleteCallLogById } = require("../services/callLog.service")
const { setResponseBody } = require("../utils/responseFormatter.util")

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
            outcome,
            followUp,
            remarks
        } = request.body

        const { tenantId, userId } = request.user

        const callLog = await createCallLog(tenantId, {
            lead,
            outcome,
            followUp,
            remarks,
            owner: userId,
            tenantId,
        })

        const callLogObj = callLog.toObject()
        const { deleted, ...sanitizedCallLog } = callLogObj

        return response.status(201).send(
                    setResponseBody(
                        'Call log created successfully',
                        null,
                        ERROR_CODES.CALL_LOG_CREATED,
                        sanitizedCallLog,
                    ),
                )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'internal_server_error',
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
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'internal_server_error',
                null,
            ),
        )
    }
}

const getACallLog = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        const callLog = await getCallLogById(tenantId, id)

        if (!callLog) {
            return response.status(404).send(
                setResponseBody(
                    'Call log not found',
                    ERROR_CODES.NOT_FOUND,
                    'not_found',
                    null,
                ),
            )
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
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'internal_server_error',
                null,
            ),
        )
    }
}

const updateACallLog = async (request, response) => {
    try {
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
        console.log(error)
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'internal_server_error',
                null,
            ),
        )
    }
}

const deleteACallLog = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        const callLog = await deleteCallLogById(tenantId, id)

        return response.status(200).send(
            setResponseBody(
                'Call log deleted successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLog,
            ),
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(
                error.message,
                ERROR_CODES.INTERNAL_SERVER_ERROR,
                'internal_server_error',
                null,
            ),
        )
    }
}

module.exports = {
    create,
    getAll,
    getACallLog,
    updateACallLog,
    deleteACallLog,
}
