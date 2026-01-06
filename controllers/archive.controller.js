const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const {
    getArchivedLeads,
    getArchivedLeadById,
    restoreLeadById,
    permanentlyDeleteLeadById
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

/**
 * Restore an archived lead
 */
const restoreArchivedLead = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        await restoreLeadById(tenantId, id)

        return response.status(200).send(
            setResponseBody(
                'Lead restored successfully',
                null,
                ERROR_CODES.SUCCESS,
                { restored: true }
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
 * Permanently delete an archived lead
 */
const permanentlyDeleteLead = async (request, response) => {
    try {
        const { tenantId } = request.user
        const { id } = request.params

        await permanentlyDeleteLeadById(tenantId, id)

        return response.status(200).send(
            setResponseBody(
                'Lead permanently deleted',
                null,
                ERROR_CODES.SUCCESS,
                { deleted: true }
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
    restoreArchivedLead,
    permanentlyDeleteLead
}