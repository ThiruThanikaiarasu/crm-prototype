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
const searchLeadsByCompany = async (tenantId, companyId) => {
    if (!companyId) {
        throw new ValidationError(400, 'Company ID is required', ERROR_CODES.VALIDATION_ERROR, 'validation_error')
    }

    const Lead = leadModel(tenantId)

    const leads = await Lead.aggregate([
        {
            $match: {
                company: new mongoose.Types.ObjectId(companyId),
                'deleted.isDeleted': false
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
    ])

    return leads.length > 0 ? leads : null
}

/**
 * Create call log - handles both scenarios:
 * 1. With existing lead ID
 * 2. Without lead ID but with companyId + leadName (creates lead first)
 */
const createCallLog = async (tenantId, payload) => {
    const CallLog = callLogModel(tenantId)
    const Lead = leadModel(tenantId)
    const CompanyLead = companyLeadModel(tenantId)
    const ContactLead = contactLeadModel(tenantId)

    const {
        lead,
        companyId,
        leadName,
        outcome,
        followUp,
        remarks,
        callStartTime,
        callDuration,
        owner
    } = payload

    let leadId = lead

    // Scenario 2: No lead ID, but companyId and leadName provided - create new lead first
    if (!leadId && companyId && leadName) {
        // Verify company exists
        const company = await CompanyLead.findOne({
            _id: companyId,
            'deleted.isDeleted': false
        })

        if (!company) {
            throw new NotFoundError(404, 'Company not found', ERROR_CODES.COMPANY_NOT_FOUND, 'not_found')
        }

        // Create contact with just name and company's phone
        const contact = await ContactLead.create({
            name: leadName,
            phone: company.phone || null
        })

        // Create lead linking to company and contact
        const newLead = await Lead.create({
            company: company._id,
            contact: contact._id,
            owner: owner
        })

        leadId = newLead._id
    }

    // Validate that we have a lead ID at this point
    if (!leadId) {
        throw new ValidationError(
            400,
            'Either lead ID or (companyId + leadName) is required',
            ERROR_CODES.VALIDATION_ERROR,
            'validation_error'
        )
    }

    // Verify lead exists
    const existingLead = await Lead.findOne({
        _id: leadId,
        'deleted.isDeleted': false
    })

    if (!existingLead) {
        throw new NotFoundError(404, 'Lead not found', ERROR_CODES.LEAD_NOT_FOUND, 'not_found')
    }

    // Validate required fields
    if (!callStartTime) {
        throw new ValidationError(
            400,
            'Call start time is required',
            ERROR_CODES.VALIDATION_ERROR,
            'validation_error'
        )
    }

    if (callDuration === undefined || callDuration === null) {
        throw new ValidationError(
            400,
            'Call duration is required',
            ERROR_CODES.VALIDATION_ERROR,
            'validation_error'
        )
    }

    // Validate callDuration
    if (typeof callDuration !== 'number' || callDuration < 0) {
        throw new ValidationError(
            400,
            'Call duration must be a non-negative number',
            ERROR_CODES.VALIDATION_ERROR,
            'validation_error'
        )
    }

    // Create call log with all required fields
    const callLog = await CallLog.create({
        lead: leadId,
        outcome,
        followUp,
        remarks,
        callStartTime,
        callDuration,
        owner
    })

    // Return call log with full details using aggregation
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

    // Validate callDuration if being updated
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

    // Update allowed fields
    const allowedFields = ['outcome', 'followUp', 'remarks', 'callStartTime', 'callDuration']

    allowedFields.forEach(field => {
        if (payload[field] !== undefined) {
            callLog[field] = payload[field]
        }
    })

    await callLog.save()

    // Return updated call log with full details
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

module.exports = {
    createCallLog,
    getAllCallLogs,
    getCallLogById,
    updateCallLog,
    deleteCallLogById,
    searchCompanies,
    searchLeadsByCompany,
}