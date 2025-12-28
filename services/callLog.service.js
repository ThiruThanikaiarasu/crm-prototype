const { default: mongoose } = require("mongoose")
const { ERROR_CODES } = require("../constants/error.constant")
const NotFoundError = require("../errors/NotFoundError")
const callLogModel = require("../models/callLog.model")
const leadModel = require("../models/lead.model")

const createCallLog = async (tenantId, callLog) => {
    const CallLog = callLogModel(tenantId)
    return await CallLog.create(callLog)
}

const getAllCallLogs = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        lead,
        outcome,
        followUp,
        remarks,
        sort = 'createdAt',
        order = 'desc',
    } = {}
) => {
    const CallLog = callLogModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    if (lead) {
        matchStage.lead = new mongoose.Types.ObjectId(lead)
    }

    if (outcome) {
        matchStage.outcome = outcome
    }

    if (remarks) {
        matchStage.remarks = remarks
    }

    if (followUp) {
        const date = new Date(followUp)
        if (!isNaN(date.getTime())) {
            const nextDay = new Date(date)
            nextDay.setDate(date.getDate() + 1)
            matchStage.followUp = {
                $gte: date,
                $lt: nextDay
            }
        }
    }

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    const result = await CallLog.aggregate([
        { $match: matchStage },

        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },

        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$lead.company' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.company'
            }
        },
        {
            $unwind: {
                path: '$lead.company',
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: '$lead.contact' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$contactId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.contact'
            }
        },
        {
            $unwind: {
                path: '$lead.contact',
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $project: {
                deleted: 0,
                'lead.deleted': 0
            }
        },

        {
            $facet: {
                data: [
                    { $sort: { [sort]: sortOrder } },
                    { $skip: skip },
                    { $limit: Number(limit) }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ])

    const callLogs = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        callLogs,
        info: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasMoreRecords: page < totalPages
        }
    }
}

const getCallLogById = async (tenantId, id) => {
    const CallLog = callLogModel(tenantId)

    const result = await CallLog.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': false
            }
        },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$lead.company' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.company'
            }
        },
        {
            $unwind: {
                path: '$lead.company',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: '$lead.contact' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$contactId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.contact'
            }
        },
        {
            $unwind: {
                path: '$lead.contact',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0
            }
        }
    ])

    return result[0] || null
}

const updateCallLog = async (tenantId, id, payload) => {
    const CallLog = callLogModel(tenantId)

    const callLog = await CallLog.findOne({
        _id: id,
        'deleted.isDeleted': false
    })

    if (!callLog) {
        throw new NotFoundError(
            404,
            'Call log not found',
            ERROR_CODES.CALL_LOG_NOT_FOUND,
            'not_found'
        )
    }

    Object.keys(payload).forEach(key => {
        if (key !== 'lead' && payload[key] !== undefined) {
            callLog[key] = payload[key]
        }
    })

    await callLog.save()

    const result = await CallLog.aggregate([
        {
            $match: {
                _id: callLog._id
            }
        },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$lead.company' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.company'
            }
        },
        {
            $unwind: {
                path: '$lead.company',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: '$lead.contact' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$contactId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    { $project: { deleted: 0 } }
                ],
                as: 'lead.contact'
            }
        },
        {
            $unwind: {
                path: '$lead.contact',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0
            }
        }
    ])

    return result[0] || null
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