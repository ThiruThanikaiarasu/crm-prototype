const { validationResult } = require('express-validator')
const { setResponseBody } = require('../utils/responseFormatter.util')
const { ERROR_CODES } = require('../constants/error.constant')
const { getCallLogReportData } = require('../services/callLog.service')

/**
 * Get call log reports with various filters
 * Supports:
 * - Time period filtering (day/week/month)
 * - Lead filtering
 * - CreatedBy filtering
 * - Pagination
 */
const getCallLogReports = async (request, response) => {
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
            page,
            limit,
            period,
            date,
            lead,
            sort,
            createdBy,
            order
        } = request.query

        const result = await getCallLogReportData(tenantId, {
            page,
            limit,
            period,
            date,
            lead,
            createdBy,
            sort,
            order
        })

        return response.status(200).send(
            setResponseBody(
                'Call log reports fetched successfully',
                null,
                ERROR_CODES.SUCCESS,
                result,
            ),
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

module.exports = {
    getCallLogReports
}
