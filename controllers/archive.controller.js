const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const {
    getArchivedLeads,
    getArchivedLeadById,
    getArchivedPipelines,
    getArchivedPipelineById,
    getArchivedCallLogs,
    getArchivedCallLogById,
    getDroppedLeads,
    getDroppedLeadById: getDroppedLeadByIdService,
    getArchivedProspectuses
} = require('../services/archive.service')

/**
 * Get all archived leads
 */
const getAllArchivedLeads = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            contact,
            company,
            status,
            source,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        } = request.query

        const result = await getArchivedLeads(tenantId, {
            page,
            limit,
            contact,
            company,
            status,
            source,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        })

        return response.status(200).send(
            setResponseBody(
                'Archived leads retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
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

/**
 * Get single archived lead by ID
 */
const getArchivedLead = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        const lead = await getArchivedLeadById(tenantId, id)

        if (!lead) {
            return response.status(404).send(
                setResponseBody(
                    'Archived lead not found',
                    ERROR_CODES.LEAD_NOT_FOUND,
                    'not_found',
                    null
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Archived lead retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                lead
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

const getAllArchivedPipelines = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            opportunityStage,
            owner,
            company,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        } = request.query

        const result = await getArchivedPipelines(tenantId, {
            page,
            limit,
            opportunityStage,
            owner,
            company,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        })

        return response.status(200).send(
            setResponseBody(
                'Archived pipelines retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
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

const getArchivedPipeline = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        const pipeline = await getArchivedPipelineById(tenantId, id)

        if (!pipeline) {
            return response.status(404).send(
                setResponseBody(
                    'Archived pipeline not found',
                    ERROR_CODES.PIPELINE_NOT_FOUND,
                    'not_found',
                    null
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Archived pipeline retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                pipeline
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

const getAllArchivedCallLogs = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            lead,
            outcome,
            remarks,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        } = request.query

        const result = await getArchivedCallLogs(tenantId, {
            page,
            limit,
            lead,
            outcome,
            remarks,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        })

        return response.status(200).send(
            setResponseBody(
                'Archived call logs retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
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

/**
 * Get single archived call log by ID
 */
const getArchivedCallLog = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        const callLog = await getArchivedCallLogById(tenantId, id)

        if (!callLog) {
            return response.status(404).send(
                setResponseBody(
                    'Archived call log not found',
                    ERROR_CODES.CALL_LOG_NOT_FOUND,
                    'not_found',
                    null
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Archived call log retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                callLog
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

/**
 * Get all dropped leads
 */
const getAllDroppedLeads = async (request, response) => {
    try {
        const { tenantId, role } = request.user
        const {
            page,
            limit,
            contact,
            company,
            source,
            sort,
            order,
            followUp,
            priority,
            serviceType,
            owner
        } = request.query

        // Ensure serviceType is always an array or undefined
        let serviceTypeArray = undefined
        if (serviceType) {
            serviceTypeArray = Array.isArray(serviceType) ? serviceType : [serviceType]
        }

        const result = await getDroppedLeads(tenantId, {
            page,
            limit,
            contact,
            company,
            source,
            sort,
            order,
            followUp,
            priority,
            serviceType: serviceTypeArray,
            owner
        }, role)

        return response.status(200).send(
            setResponseBody(
                'Dropped leads retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
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

/**
 * Get dropped lead by ID
 */
const getDroppedLeadById = async (request, response) => {
    try {
        const { tenantId, role } = request.user
        const { id } = request.params

        const lead = await getDroppedLeadByIdService(tenantId, id, role)

        if (!lead) {
            return response.status(404).send(
                setResponseBody(
                    'Dropped lead not found',
                    ERROR_CODES.LEAD_NOT_FOUND,
                    'not_found',
                    null
                )
            )
        }

        return response.status(200).send(
            setResponseBody(
                'Dropped lead retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
                lead
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

const getAllArchivedProspectuses = async (request, response) => {
    try {
        const { tenantId } = request.user
        const {
            page,
            limit,
            contact,
            company,
            status,
            source,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        } = request.query

        const result = await getArchivedProspectuses(tenantId, {
            page,
            limit,
            contact,
            company,
            status,
            source,
            sort,
            order,
            deletedBy,
            deletedFrom,
            deletedTo
        })

        return response.status(200).send(
            setResponseBody(
                'Archived prospectuses retrieved successfully',
                null,
                ERROR_CODES.SUCCESS,
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
    getAllArchivedLeads,
    getArchivedLead,

    getAllArchivedPipelines,
    getArchivedPipeline,

    getAllArchivedCallLogs,
    getArchivedCallLog,

    getAllDroppedLeads,
    getDroppedLeadById,

    getAllArchivedProspectuses
}