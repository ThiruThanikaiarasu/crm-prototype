const { ERROR_CODES } = require("../constants/error.constant")
const callLogModel = require("../models/callLog.model")

const createCallLog = async (tenantId, callLog) => {
    const CallLog = callLogModel(tenantId)
    return await CallLog.create(callLog)
}

const getAllCallLogs = async (tenantId, {
    page = 1,
    limit = 10,
    lead,
    outcome,
    followUp,
    remarks,
    sort = 'createdAt',
    order = 'desc',
} = {}) => {
    const CallLog = callLogModel(tenantId)
    const query = {}

    if (lead) {
        query.lead = lead
    }
    if (outcome) {
        query.outcome = outcome
    }
    if (followUp) {
        const date = new Date(followUp)
        if (!isNaN(date.getTime())) {
            // Match the entire day
            const nextDay = new Date(date)
            nextDay.setDate(date.getDate() + 1)
            query.followUp = {
                $gte: date,
                $lt: nextDay
            }
        }
    }
    if (remarks) {
        query.remarks = remarks
    }

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1
    const sortOptions = { [sort]: sortOrder }

    const [callLogs, total] = await Promise.all([
        CallLog.find(query)
            // .notDeleted()
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit)),

        CallLog.countDocuments({
            ...query,
            'deleted.isDeleted': false,
        }),
    ])


    const totalPages = Math.ceil(total / limit)

    return {
        callLogs,
        info: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasMoreRecords: page < totalPages,
        },
    }
}

const getCallLogById = async (tenantId, id) => {
    const CallLog = callLogModel(tenantId)
    return await CallLog.findById(id)
}

const updateCallLog = async (tenantId, id, payload) => {
    const CallLog = callLogModel(tenantId)
    const callLog = await CallLog.findById(id)

    if (!callLog) {
        throw new NotFoundError(404, 'Call log not found', ERROR_CODES.CALL_LOG_NOT_FOUND, 'not_found')
    }

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) return

        callLog[key] = payload[key]
    })
    return await callLog.save()
}

const deleteCallLogById = async (tenantId, userId, id) => {
    const CallLog = callLogModel(tenantId)
    const callLog = await CallLog.findById(id)

    if (!callLog) {
        throw new NotFoundError(404, 'Call log not found', ERROR_CODES.CALL_LOG_NOT_FOUND, 'not_found')
    }

    callLog.deleted.isDeleted = true
    callLog.deleted.at = new Date()
    callLog.deleted.by = userId

    await callLog.save()
    return callLog
}

module.exports = {
    createCallLog,
    getAllCallLogs,
    getCallLogById,
    updateCallLog,
    deleteCallLogById,
}