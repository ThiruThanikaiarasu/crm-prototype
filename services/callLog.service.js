const { default: mongoose } = require("mongoose")
const { ERROR_CODES } = require("../constants/error.constant")
const NotFoundError = require("../errors/NotFoundError")
const ValidationError = require("../errors/ValidationError")
const callLogModel = require("../models/callLog.model")
const leadModel = require("../models/lead.model")
const companyLeadModel = require("../models/companyLead.model")
const contactLeadModel = require("../models/contactLead.model")

/**
 * Search companies by name
 */
const searchCompanies = async (tenantId, { search = '', page = 1, limit = 10 } = {}) => {
    const CompanyLead = companyLeadModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    if (search) {
        matchStage.name = { $regex: search, $options: 'i' }
    }

    const skip = (page - 1) * limit

    const result = await CompanyLead.aggregate([
        { $match: matchStage },
        {
            $facet: {
                data: [
                    { $sort: { name: 1 } },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    { $project: { deleted: 0 } }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ])

    const companies = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        companies,
        info: {
            total,
            page: Number(page),
            limit: Number(limit),
            totalPages,
            hasMoreRecords: page < totalPages
        }
    }
}

/**
 * Search leads by company ID
 */
const searchLeads = async (tenantId) => {

    const Lead = leadModel(tenantId)

    const leads = await Lead.aggregate([
        {
            $match: {
                'deleted.isDeleted': false,
                status: {
                    $nin: ['new', 'qualified', 'dropped']
                }
            }
        },
        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: '$contact' },
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
                as: 'contact'
            }
        },
        {
            $unwind: {
                path: '$contact',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$company' },
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
                as: 'company'
            }
        },
        {
            $unwind: {
                path: '$company',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                name: '$contact.name',
                email: '$contact.email',
                phone: '$contact.phone'
            }
        },
        {
            $project: {
                deleted: 0,
                contact: 0
            }
        },
        { $sort: { createdAt: -1 } }
    ])

    return leads.length > 0 ? leads : null
}

/**
 * Create call log - handles both scenarios:
 * 1. With existing lead ID
 * 2. Without lead ID but with companyId + leadName (creates lead first)
 */
const createCallLog = async (tenantId, payload) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const CallLog = callLogModel(tenantId)
        const Lead = leadModel(tenantId)

        const {
            lead,
            outcome,
            droppedReason,
            followUp,
            remarks,
            callStartTime,
            callDuration,
            owner
        } = payload

        if (!lead) {
            throw new ValidationError(
                400,
                'Lead ID is required',
                ERROR_CODES.VALIDATION_ERROR,
                'validation_error'
            )
        }

        const existingLead = await Lead.findOne({
            _id: lead,
            'deleted.isDeleted': false
        }).session(session)

        if (!existingLead) {
            throw new NotFoundError(
                404,
                'Lead not found',
                ERROR_CODES.LEAD_NOT_FOUND,
                'not_found'
            )
        }

        /* -------------------- Validate outcome -------------------- */

        if (!outcome) {
            throw new ValidationError(
                400,
                'Call outcome is required',
                ERROR_CODES.VALIDATION_ERROR,
                'validation_error'
            )
        }

        /* -------------------- Update lead status -------------------- */

        existingLead.status = outcome

        if (outcome === 'dropped') {
            if (!droppedReason || droppedReason.trim().length === 0) {
                throw new ValidationError(
                    400,
                    'Dropped reason is required when outcome is dropped',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error'
                )
            }
            existingLead.droppedReason = droppedReason
        } else {
            // Clean up stale droppedReason if status changes
            existingLead.droppedReason = undefined
        }

        // Optional: sync follow-up if call sets it
        if (followUp !== undefined) {
            existingLead.followUp = followUp
        }

        await existingLead.save({ session })

        /* -------------------- Create call log -------------------- */

        const callLog = await CallLog.create(
            [{
                lead,
                followUp,
                remarks,
                callStartTime,
                callDuration,
                owner
            }],
            { session }
        )

        await session.commitTransaction()

        /* -------------------- Return enriched call log -------------------- */
        // (your aggregation stays the same)
        const result = await CallLog.aggregate([
            { $match: { _id: callLog[0]._id } },
            // ... rest of your aggregation
        ])

        return result[0] || null

    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}


/**
 * Get all call logs with filtering and pagination
 */
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
        matchStage.remarks = { $regex: remarks, $options: 'i' }
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
            $lookup: {
                from: `${tenantId}_leads`,
                let: { companyId: '$lead.company._id', currentLeadId: '$lead._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$company', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] },
                                    { $ne: ['$_id', '$$currentLeadId'] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${tenantId}_contactleads`,
                            let: { contactId: '$contact' },
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
                            as: 'contact'
                        }
                    },
                    {
                        $unwind: {
                            path: '$contact',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            name: '$contact.name',
                            email: '$contact.email',
                            phone: '$contact.phone'
                        }
                    },
                    {
                        $project: {
                            deleted: 0,
                            contact: 0
                        }
                    },
                    { $sort: { createdAt: -1 } }
                ],
                as: 'lead.company.leads'
            }
        },
        {
            $addFields: {
                'lead.company.leads': {
                    $cond: {
                        if: { $eq: [{ $size: '$lead.company.leads' }, 0] },
                        then: null,
                        else: '$lead.company.leads'
                    }
                },
                'lead.name': '$lead.contact.name',
                'lead.email': '$lead.contact.email',
                'lead.phone': '$lead.contact.phone'
            }
        },
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0,
                'lead.contact': 0
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

/**
 * Get call log by ID
 */
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
            $lookup: {
                from: `${tenantId}_leads`,
                let: { companyId: '$lead.company._id', currentLeadId: '$lead._id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$company', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] },
                                    { $ne: ['$_id', '$$currentLeadId'] }
                                ]
                            }
                        }
                    },
                    {
                        $lookup: {
                            from: `${tenantId}_contactleads`,
                            let: { contactId: '$contact' },
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
                            as: 'contact'
                        }
                    },
                    {
                        $unwind: {
                            path: '$contact',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            name: '$contact.name',
                            email: '$contact.email',
                            phone: '$contact.phone'
                        }
                    },
                    {
                        $project: {
                            deleted: 0,
                            contact: 0
                        }
                    },
                    { $sort: { createdAt: -1 } }
                ],
                as: 'lead.company.leads'
            }
        },
        {
            $addFields: {
                'lead.company.leads': {
                    $cond: {
                        if: { $eq: [{ $size: '$lead.company.leads' }, 0] },
                        then: null,
                        else: '$lead.company.leads'
                    }
                },
                'lead.name': '$lead.contact.name',
                'lead.email': '$lead.contact.email',
                'lead.phone': '$lead.contact.phone'
            }
        },
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0,
                'lead.contact': 0
            }
        }
    ])

    return result[0] || null
}

/**
 * Update call log by ID
 */
const updateCallLog = async (tenantId, id, payload) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const CallLog = callLogModel(tenantId)
        const Lead = leadModel(tenantId)

        const callLog = await CallLog.findOne({
            _id: id,
            'deleted.isDeleted': false
        }).session(session)

        if (!callLog) {
            throw new NotFoundError(
                404,
                'Call log not found',
                ERROR_CODES.CALL_LOG_NOT_FOUND,
                'not_found'
            )
        }

        /* -------------------- Validate callDuration -------------------- */
        if (payload.callDuration !== undefined && payload.callDuration !== null) {
            if (typeof payload.callDuration !== 'number' || payload.callDuration < 0) {
                throw new ValidationError(
                    400,
                    'Call duration must be a non-negative number',
                    ERROR_CODES.VALIDATION_ERROR,
                    'validation_error'
                )
            }
        }

        /* -------------------- Update call log fields -------------------- */
        const allowedFields = [
            'outcome',
            'followUp',
            'remarks',
            'callStartTime',
            'callDuration'
        ]

        allowedFields.forEach(field => {
            if (payload[field] !== undefined) {
                callLog[field] = payload[field]
            }
        })

        /* -------------------- Sync lead status if outcome changed -------------------- */
        if (payload.outcome !== undefined) {
            const lead = await Lead.findOne({
                _id: callLog.lead,
                'deleted.isDeleted': false
            }).session(session)

            if (!lead) {
                throw new NotFoundError(
                    404,
                    'Lead not found',
                    ERROR_CODES.LEAD_NOT_FOUND,
                    'not_found'
                )
            }

            lead.status = payload.outcome

            if (payload.outcome === 'dropped') {
                if (
                    !payload.droppedReason ||
                    typeof payload.droppedReason !== 'string' ||
                    payload.droppedReason.trim().length === 0
                ) {
                    throw new ValidationError(
                        400,
                        'Dropped reason is required when outcome is dropped',
                        ERROR_CODES.VALIDATION_ERROR,
                        'validation_error'
                    )
                }
                lead.droppedReason = payload.droppedReason
            } else {
                // Clean stale dropped reason if status changes
                lead.droppedReason = undefined
            }

            await lead.save({ session })
        }

        /* -------------------- Save call log -------------------- */
        await callLog.save({ session })

        await session.commitTransaction()

        /* -------------------- Return enriched call log -------------------- */
        const result = await CallLog.aggregate([
            { $match: { _id: callLog._id } },

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
                    from: `${tenantId}_companyLeads`,
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
                        }
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
                    from: `${tenantId}_contactLeads`,
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
                        }
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
                $lookup: {
                    from: `${tenantId}_leads`,
                    let: {
                        companyId: '$lead.company._id',
                        currentLeadId: '$lead._id'
                    },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ['$company', '$$companyId'] },
                                        { $eq: ['$deleted.isDeleted', false] },
                                        { $ne: ['$_id', '$$currentLeadId'] }
                                    ]
                                }
                            }
                        },
                        {
                            $lookup: {
                                from: `${tenantId}_contactLeads`,
                                let: { contactId: '$contact' },
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
                                    }
                                ],
                                as: 'contact'
                            }
                        },
                        {
                            $unwind: {
                                path: '$contact',
                                preserveNullAndEmptyArrays: true
                            }
                        },
                        {
                            $addFields: {
                                name: '$contact.name',
                                email: '$contact.email',
                                phone: '$contact.phone'
                            }
                        },
                        {
                            $project: {
                                deleted: 0,
                                contact: 0
                            }
                        },
                        { $sort: { createdAt: -1 } }
                    ],
                    as: 'lead.company.leads'
                }
            },

            {
                $addFields: {
                    'lead.company.leads': {
                        $cond: {
                            if: { $eq: [{ $size: '$lead.company.leads' }, 0] },
                            then: null,
                            else: '$lead.company.leads'
                        }
                    },
                    'lead.name': '$lead.contact.name',
                    'lead.email': '$lead.contact.email',
                    'lead.phone': '$lead.contact.phone'
                }
            },
            {
                $project: {
                    deleted: 0,
                    'lead.deleted': 0,
                    'lead.contact': 0
                }
            }
        ])

        return result[0] || null

    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}


/**
 * Soft delete call log by ID
 */
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

const restoreCallLogById = async (tenantId, userId, id) => {
    const CallLog = callLogModel(tenantId)
    const result = await CallLog.updateOne(
        {
            _id: id,
            'deleted.isDeleted': true
        },
        {
            $set: {
                'deleted.isDeleted': false,
                'deleted.restoredAt': new Date(),
                'deleted.restoredBy': userId
            }
        }
    )

    if (result.matchedCount === 0) {
        throw new NotFoundError(
            404,
            'Call log not found',
            ERROR_CODES.CALL_LOG_NOT_FOUND,
            'not_found'
        )
    }
}

const getPreviousCallLogDetails = async (tenantId, leadId) => {
    const CallLog = callLogModel(tenantId)
    console.log(leadId)
    const result = await CallLog.aggregate([
        {
            $match: {
                lead: new mongoose.Types.ObjectId(leadId),
                'deleted.isDeleted': false
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $limit: 1
        },

        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        {
            $unwind: '$lead'
        },

        {
            $lookup: {
                from: `${tenantId}_contactLeads`,
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
                    }
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
            $addFields: {
                'lead.name': '$lead.contact.name',
                'lead.email': '$lead.contact.email',
                'lead.phone': '$lead.contact.phone'
            }
        },
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0,
                'lead.contact.deleted': 0
            }
        }
    ])

    return result[0] || null
}

const getCompanyCallLogActivityDetails = async (tenantId, companyId) => {
    console.log(tenantId, companyId)
    const Lead = leadModel(tenantId)

    const result = await Lead.aggregate([
        {
            $match: {
                company: new mongoose.Types.ObjectId(companyId),
                'deleted.isDeleted': false
            }
        },

        {
            $lookup: {
                from: `${tenantId}_callLogs`,
                let: { leadId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$lead', '$$leadId'] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    },
                    {
                        $sort: { createdAt: 1 }
                    },
                    {
                        $project: {
                            deleted: 0
                        }
                    }
                ],
                as: 'callLogs'
            }
        },

        {
            $project: {
                deleted: 0
            }
        }
    ])

    return result
}

module.exports = {
    createCallLog,
    getAllCallLogs,
    getCallLogById,
    updateCallLog,
    deleteCallLogById,
    searchCompanies,
    searchLeads,
    restoreCallLogById,
    getPreviousCallLogDetails,
    getCompanyCallLogActivityDetails
}