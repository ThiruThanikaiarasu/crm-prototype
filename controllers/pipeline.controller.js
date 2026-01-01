const { validationResult } = require("express-validator")
const { ERROR_CODES } = require("../constants/error.constant")
const { setResponseBody } = require("../utils/responseFormatter.util")
const {
    createPipeline,
    getAllPipelines,
    getPipelineById,
    updatePipelineById,
    deletePipelineById
} = require("../services/pipeline.service")

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

        const { tenantId, userId } = request.user
        const {
            company,
            opportunityStage,
            estimatedValue,
            probability,
            expectedRevnue,
            nextStep,
            followUp,
            remarks
        } = request.body

        const pipeline = await createPipeline(tenantId, {
            company,
            opportunityStage,
            estimatedValue,
            probability,
            expectedRevnue,
            nextStep,
            followUp,
            remarks,
            owner: userId
        })

        return response.status(201).send(
            setResponseBody(
                'Pipeline created successfully',
                null,
                ERROR_CODES.PIPELINE_CREATED,
                pipeline,
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
        const { opportunityStage, owner, company } = request.query

        const pipelines = await getAllPipelines(tenantId, {
            opportunityStage,
            owner,
            company
        })

        return response.status(200).send(
            setResponseBody(
                'Pipelines fetched successfully',
                null,
                ERROR_CODES.PIPELINES_FETCHED,
                pipelines,
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

const getAPipelineById = async (request, response) => {
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

        const pipeline = await getPipelineById(tenantId, id)

        if (!pipeline) {
            return response.status(404).send(
                setResponseBody(
                    'Pipeline not found',
                    ERROR_CODES.PIPELINE_NOT_FOUND,
                    'not_found',
                    null,
                ),
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Pipeline fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                pipeline,
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

const updateAPipelineById = async (request, response) => {
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

        const pipeline = await updatePipelineById(tenantId, id, request.body)

        return response.status(200).send(
            setResponseBody(
                'Pipeline updated successfully',
                null,
                ERROR_CODES.SUCCESS,
                pipeline,
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

const deleteAPipelineById = async (request, response) => {
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

        const pipeline = await deletePipelineById(tenantId, userId, id)

        return response.status(200).send(
            setResponseBody(
                'Pipeline deleted successfully',
                null,
                ERROR_CODES.SUCCESS,
                pipeline,
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
    getAPipelineById,
    updateAPipelineById,
    deleteAPipelineById,
}