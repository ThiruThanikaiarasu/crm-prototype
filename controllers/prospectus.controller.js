const { validationResult } = require('express-validator')
const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const {
    createProspectus,
    bulkCreateProspectus,
    validateBulkProspectus,
    getAllProspectus,
    getAProspectusById,
    updateProspectusById,
    deleteProspectusById,
    restoreProspectusById
} = require('../services/prospectus.service')
const NotFoundError = require('../errors/NotFoundError')

const createANewProspectus = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, userId } = request.user
        const prospectus = await createProspectus(request.body, tenantId, userId)

        return response.status(201).send(
            setResponseBody('Prospectus created successfully', ERROR_CODES.PROSPECTUS_CREATED, null, prospectus)
        )
    } catch (error) {
        return response.status(error.statusCode || 500).send(
            setResponseBody(
                error.message || 'Internal Server Error',
                error.errorCode || ERROR_CODES.SERVER_ERROR,
                error.errorType || 'server_error',
                null
            )
        )
    }
}

const bulkCreateProspectuses = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, userId } = request.user
        const results = await bulkCreateProspectus(request.body, tenantId, userId)

        return response.status(201).send(
            setResponseBody('Prospectuses created successfully', ERROR_CODES.PROSPECTUS_CREATED, null, results)
        )
    } catch (error) {
        return response.status(error.statusCode || 500).send(
            setResponseBody(
                error.message || 'Internal Server Error',
                error.errorCode || ERROR_CODES.SERVER_ERROR,
                error.errorType || 'server_error',
                null
            )
        )
    }
}

const validateBulkProspectuses = async (request, response) => {
    try {
        const errors = validationResult(request)
        const formatErrorsByIndex = new Map()

        if (!errors.isEmpty()) {
            const allErrors = errors.array()

            const topLevelError = allErrors.find(e => !/^\d+/.test(e.path))
            if (topLevelError) {
                return response.status(400).send(
                    setResponseBody(topLevelError.msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
                )
            }

            for (const error of allErrors) {
                const match = error.path.match(/^(\d+)/)
                if (match) {
                    const index = parseInt(match[1], 10)
                    if (!formatErrorsByIndex.has(index)) formatErrorsByIndex.set(index, [])
                    formatErrorsByIndex.get(index).push(error.msg)
                }
            }
        }

        const { tenantId } = request.user
        const results = await validateBulkProspectus(request.body, tenantId, formatErrorsByIndex)

        return response.status(200).send(
            setResponseBody('Validation complete', null, ERROR_CODES.SUCCESS, results)
        )
    } catch (error) {
        return response.status(error.statusCode || 500).send(
            setResponseBody(
                error.message || 'Internal Server Error',
                error.errorCode || ERROR_CODES.SERVER_ERROR,
                error.errorType || 'server_error',
                null
            )
        )
    }
}

const getAll = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, role } = request.user
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
            serviceType,
            owner
        } = request.query

        let serviceTypeArray = undefined
        if (serviceType) {
            serviceTypeArray = Array.isArray(serviceType) ? serviceType : [serviceType]
        }

        const result = await getAllProspectus(tenantId, {
            page,
            limit,
            contact,
            company,
            status,
            source,
            sort,
            order,
            followUp,
            serviceType: serviceTypeArray,
            owner
        }, role)

        return response.status(200).send(
            setResponseBody('Prospectuses fetched successfully', null, ERROR_CODES.SUCCESS, result)
        )
    } catch (error) {
        return response.status(500).send(
            setResponseBody(error.message, ERROR_CODES.SERVER_ERROR, 'server_error', null)
        )
    }
}

const getAProspectusById_ = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, role } = request.user
        const { id } = request.params

        const prospectus = await getAProspectusById(tenantId, id, role)

        if (!prospectus) {
            throw new NotFoundError(404, 'Prospectus not found', ERROR_CODES.PROSPECTUS_NOT_FOUND, 'not_found')
        }

        return response.status(200).send(
            setResponseBody('Prospectus fetched successfully', null, ERROR_CODES.SUCCESS, prospectus)
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

const updateAProspectusById = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, userId } = request.user
        const { id } = request.params

        const prospectus = await updateProspectusById(tenantId, id, request.body, userId)

        return response.status(200).send(
            setResponseBody('Prospectus updated successfully', null, ERROR_CODES.SUCCESS, prospectus)
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

const deleteAProspectusById = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, userId } = request.user
        const { id } = request.params

        await deleteProspectusById(tenantId, userId, id)

        return response.status(200).send(
            setResponseBody('Prospectus deleted successfully', null, ERROR_CODES.SUCCESS, null)
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

const restoreAProspectusById = async (request, response) => {
    try {
        const errors = validationResult(request)
        if (!errors.isEmpty()) {
            return response.status(400).send(
                setResponseBody(errors.array()[0].msg, ERROR_CODES.VALIDATION_ERROR, 'validation_error', null)
            )
        }

        const { tenantId, userId } = request.user
        const { id } = request.params

        await restoreProspectusById(tenantId, userId, id)

        return response.status(200).send(
            setResponseBody('Prospectus restored successfully', null, ERROR_CODES.SUCCESS, null)
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
    createANewProspectus,
    bulkCreateProspectuses,
    validateBulkProspectuses,
    getAll,
    getAProspectusById: getAProspectusById_,
    updateAProspectusById,
    deleteAProspectusById,
    restoreAProspectusById
}
