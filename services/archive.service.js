const mongoose = require('mongoose')
const leadModel = require('../models/lead.model')
const callLogModel = require('../models/callLog.model')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
const pipelineModel = require('../models/pipeline.model')
const prospectusModel = require('../models/prospectus.model')
// Import other models as needed (pipeline, calllog, etc.)

const {
    getLeadByIdWithDetails,
    getAllLeadsWithPagination
} = require('../repositories/lead.repository')

/**
 * Get all filtered dropped leads
 */
const getDroppedLeads = async (tenantId, filters = {}, userRole = null) => {
    // Force status to be 'dropped'
    const droppedFilters = {
        ...filters,
        status: 'dropped'
    }

    // Call repository with allowDropped: true
    return await getAllLeadsWithPagination(tenantId, droppedFilters, userRole, { allowDropped: true })
}

/**
 * Get dropped lead by ID
 */
const getDroppedLeadById = async (tenantId, id, userRole = null) => {
    // Call repository with allowDropped: true
    const lead = await getLeadByIdWithDetails(tenantId, id, userRole, { allowDropped: true })

    // Verify it is actually dropped
    if (lead && lead.status === 'dropped') {
        return lead
    }

    return null
}

/**
 * Get all archived/deleted leads with pagination
 */
const getArchivedLeads = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        contact,
        company,
        status,
        source,
        sort = 'deleted.at',
        order = 'desc',
        deletedBy,
        deletedFrom,
        deletedTo,
    } = {}
) => {
    const Lead = leadModel(tenantId)

    const skip = (page - 1) * limit

    // Match only deleted leads
    const matchConditions = {
        'deleted.isDeleted': true
    }

    if (status) {
        matchConditions.status = status
    }

    if (source) {
        matchConditions.source = {
            $regex: new RegExp(source, 'i'),
            $ne: null
        }
    }

    if (deletedBy) {
        matchConditions['deleted.by'] = new mongoose.Types.ObjectId(deletedBy)
    }

    // Filter by deletion date range
    if (deletedFrom || deletedTo) {
        matchConditions['deleted.at'] = {}

        if (deletedFrom) {
            const startOfDay = new Date(deletedFrom)
            startOfDay.setHours(0, 0, 0, 0)
            matchConditions['deleted.at'].$gte = startOfDay
        }

        if (deletedTo) {
            const endOfDay = new Date(deletedTo)
            endOfDay.setHours(23, 59, 59, 999)
            matchConditions['deleted.at'].$lte = endOfDay
        }
    }

    const pipeline = [
        {
            $match: matchConditions
        },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$company' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$companyId'] }
                        }
                    }
                ],
                as: 'company'
            }
        },
        { $unwind: '$company' },
        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: '$contact' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$contactId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        }
    ]

    // Apply filters after lookup if provided
    const postLookupMatch = {}
    if (company) {
        postLookupMatch['company.name'] = { $regex: company, $options: 'i' }
    }
    if (contact) {
        postLookupMatch['contact.name'] = { $regex: contact, $options: 'i' }
    }
    if (Object.keys(postLookupMatch).length > 0) {
        pipeline.push({
            $match: postLookupMatch
        })
    }

    // Group by company
    pipeline.push({
        $group: {
            _id: '$company._id',
            companyDetails: { $first: '$company' },
            matchedLeadsCount: { $sum: 1 },
            maxDeletedAt: { $max: '$deleted.at' },
            maxCreatedAt: { $max: '$createdAt' }
        }
    })

    // Determine sort field
    const allowedSortFields = ['deleted.at', 'createdAt', 'matchedLeadsCount']
    let sortField

    if (sort === 'deleted.at') {
        sortField = 'maxDeletedAt'
    } else if (sort === 'createdAt') {
        sortField = 'maxCreatedAt'
    } else {
        sortField = 'matchedLeadsCount'
    }

    const sortOrder = order === 'asc' ? 1 : -1
    const sortObject = { [sortField]: sortOrder }

    pipeline.push({
        $facet: {
            data: [
                { $sort: sortObject },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                    $lookup: {
                        from: `${tenantId}_leads`,
                        let: { companyId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$company', '$$companyId'] },
                                            { $eq: ['$deleted.isDeleted', true] }
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
                                                $expr: { $eq: ['$_id', '$$contactId'] }
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
                                $lookup: {
                                    from: `${tenantId}_users`,
                                    let: { deletedById: '$deleted.by' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ['$_id', '$$deletedById'] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                email: 1,
                                                role: 1
                                            }
                                        }
                                    ],
                                    as: 'deletedByUser'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$deletedByUser',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: `${tenantId}_users`,
                                    let: { ownerId: '$owner' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: { $eq: ['$_id', '$$ownerId'] }
                                            }
                                        },
                                        {
                                            $project: {
                                                _id: 1,
                                                firstName: 1,
                                                lastName: 1,
                                                email: 1,
                                                role: 1
                                            }
                                        }
                                    ],
                                    as: 'owner'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$owner',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $addFields: {
                                    name: '$contact.name',
                                    email: '$contact.email',
                                    phone: '$contact.phone',
                                    'deleted.by': '$deletedByUser'
                                }
                            },
                            { $sort: { 'deleted.at': -1 } },
                            {
                                $project: {
                                    contact: 0,
                                    deletedByUser: 0
                                }
                            }
                        ],
                        as: 'leads'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: '$companyDetails',
                        leads: 1
                    }
                }
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    })

    const result = await Lead.aggregate(pipeline)

    const companies = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        leads: companies,
        info: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasMoreRecords: page < totalPages
        }
    }
}

/**
 * Get a single archived lead by ID
 */
const getArchivedLeadById = async (tenantId, id) => {
    const Lead = leadModel(tenantId)

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$company' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$companyId'] }
                        }
                    }
                ],
                as: 'company'
            }
        },
        {
            $unwind: '$company'
        },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                let: { companyId: '$company._id', currentLeadId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$company', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', true] },
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
                                        $expr: { $eq: ['$_id', '$$contactId'] }
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
                        $lookup: {
                            from: `${tenantId}_users`,
                            let: { deletedById: '$deleted.by' },
                            pipeline: [
                                {
                                    $match: {
                                        $expr: { $eq: ['$_id', '$$deletedById'] }
                                    }
                                },
                                {
                                    $project: {
                                        _id: 1,
                                        firstName: 1,
                                        lastName: 1,
                                        email: 1,
                                        role: 1
                                    }
                                }
                            ],
                            as: 'deletedByUser'
                        }
                    },
                    {
                        $unwind: {
                            path: '$deletedByUser',
                            preserveNullAndEmptyArrays: true
                        }
                    },
                    {
                        $addFields: {
                            name: '$contact.name',
                            email: '$contact.email',
                            phone: '$contact.phone',
                            'deleted.by': '$deletedByUser'
                        }
                    },
                    {
                        $project: {
                            contact: 0,
                            deletedByUser: 0
                        }
                    },
                    { $sort: { 'deleted.at': -1 } }
                ],
                as: 'company.leads'
            }
        },
        {
            $addFields: {
                'company.leads': {
                    $cond: {
                        if: { $eq: [{ $size: '$company.leads' }, 0] },
                        then: null,
                        else: '$company.leads'
                    }
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
                            $expr: { $eq: ['$_id', '$$contactId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                name: '$contact.name',
                email: '$contact.email',
                phone: '$contact.phone',
                'deleted.by': '$deletedByUser'
            }
        },
        {
            $project: {
                contact: 0,
                deletedByUser: 0
            }
        }
    ]

    const result = await Lead.aggregate(pipeline)

    return result.length > 0 ? result[0] : null
}

const getArchivedPipelines = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        opportunityStage,
        owner,
        company,
        sort = 'deleted.at',
        order = 'desc',
        deletedBy,
        deletedFrom,
        deletedTo,
    } = {}
) => {
    const Pipeline = pipelineModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': true
    }

    if (opportunityStage) {
        matchStage.opportunityStage = opportunityStage
    }

    if (owner) {
        matchStage.owner = new mongoose.Types.ObjectId(owner)
    }

    if (company) {
        matchStage.company = new mongoose.Types.ObjectId(company)
    }

    if (deletedBy) {
        matchStage['deleted.by'] = new mongoose.Types.ObjectId(deletedBy)
    }

    if (deletedFrom || deletedTo) {
        matchStage['deleted.at'] = {}

        if (deletedFrom) {
            const startOfDay = new Date(deletedFrom)
            startOfDay.setHours(0, 0, 0, 0)
            matchStage['deleted.at'].$gte = startOfDay
        }

        if (deletedTo) {
            const endOfDay = new Date(deletedTo)
            endOfDay.setHours(23, 59, 59, 999)
            matchStage['deleted.at'].$lte = endOfDay
        }
    }

    const skip = (page - 1) * limit
    const sortField = sort === 'deleted.at' ? 'deleted.at' : sort
    const sortOrder = order === 'asc' ? 1 : -1

    const result = await Pipeline.aggregate([
        {
            $match: matchStage
        },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$company' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$companyId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                'deleted.by': '$deletedByUser'
            }
        },
        {
            $project: {
                deletedByUser: 0
            }
        },
        {
            $facet: {
                data: [
                    { $sort: { [sortField]: sortOrder } },
                    { $skip: skip },
                    { $limit: Number(limit) }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ])

    const pipelines = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        pipelines,
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
 * Get archived pipeline by ID
 */
const getArchivedPipelineById = async (tenantId, id) => {
    const Pipeline = pipelineModel(tenantId)

    const result = await Pipeline.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: '$company' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$companyId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                'deleted.by': '$deletedByUser'
            }
        },
        {
            $project: {
                deletedByUser: 0
            }
        }
    ])

    return result[0] || null
}

const getArchivedCallLogs = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        lead,
        outcome,
        remarks,
        sort = 'deleted.at',
        order = 'desc',
        deletedBy,
        deletedFrom,
        deletedTo,
    } = {}
) => {
    const CallLog = callLogModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': true
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

    if (deletedBy) {
        matchStage['deleted.by'] = new mongoose.Types.ObjectId(deletedBy)
    }

    if (deletedFrom || deletedTo) {
        matchStage['deleted.at'] = {}

        if (deletedFrom) {
            const startOfDay = new Date(deletedFrom)
            startOfDay.setHours(0, 0, 0, 0)
            matchStage['deleted.at'].$gte = startOfDay
        }

        if (deletedTo) {
            const endOfDay = new Date(deletedTo)
            endOfDay.setHours(23, 59, 59, 999)
            matchStage['deleted.at'].$lte = endOfDay
        }
    }

    const skip = (page - 1) * limit
    const sortField = sort === 'deleted.at' ? 'deleted.at' : sort
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
                            $expr: { $eq: ['$_id', '$$companyId'] }
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
                            $expr: { $eq: ['$_id', '$$contactId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        },

        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
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
                'lead.phone': '$lead.contact.phone',
                'deleted.by': '$deletedByUser'
            }
        },

        {
            $project: {
                'lead.deleted': 0,
                'lead.contact': 0,
                deletedByUser: 0
            }
        },

        {
            $facet: {
                data: [
                    { $sort: { [sortField]: sortOrder } },
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
 * Get archived call log by ID
 */
const getArchivedCallLogById = async (tenantId, id) => {
    const CallLog = callLogModel(tenantId)

    const result = await CallLog.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': true
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
                            $expr: { $eq: ['$_id', '$$companyId'] }
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
                            $expr: { $eq: ['$_id', '$$contactId'] }
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
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$ownerId'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'owner'
            }
        },
        {
            $unwind: {
                path: '$owner',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    {
                        $match: {
                            $expr: { $eq: ['$_id', '$$deletedById'] }
                        }
                    },
                    {
                        $project: {
                            password: 0,
                            deleted: 0
                        }
                    }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
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
                'lead.phone': '$lead.contact.phone',
                'deleted.by': '$deletedByUser'
            }
        },
        {
            $project: {
                'lead.deleted': 0,
                'lead.contact': 0,
                deletedByUser: 0
            }
        }
    ])

    return result[0] || null
}


const getArchivedProspectuses = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        contact,
        company,
        status,
        source,
        sort = 'deleted.at',
        order = 'desc',
        deletedBy,
        deletedFrom,
        deletedTo,
    } = {}
) => {
    const Prospectus = prospectusModel(tenantId)
    const skip = (page - 1) * limit

    const matchConditions = { 'deleted.isDeleted': true }

    if (status) matchConditions.status = status
    if (source) matchConditions.source = { $regex: new RegExp(source, 'i'), $ne: null }
    if (deletedBy) matchConditions['deleted.by'] = new mongoose.Types.ObjectId(deletedBy)

    if (deletedFrom || deletedTo) {
        matchConditions['deleted.at'] = {}
        if (deletedFrom) {
            const startOfDay = new Date(deletedFrom)
            startOfDay.setHours(0, 0, 0, 0)
            matchConditions['deleted.at'].$gte = startOfDay
        }
        if (deletedTo) {
            const endOfDay = new Date(deletedTo)
            endOfDay.setHours(23, 59, 59, 999)
            matchConditions['deleted.at'].$lte = endOfDay
        }
    }

    const pipeline = [
        { $match: matchConditions },
        {
            $lookup: {
                from: `${tenantId}_companyprospectuses`,
                let: { companyId: '$company' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$companyId'] } } }
                ],
                as: 'company'
            }
        },
        { $unwind: '$company' },
        {
            $lookup: {
                from: `${tenantId}_contactprospectuses`,
                let: { contactId: '$contact' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$contactId'] } } }
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
                from: `${tenantId}_users`,
                let: { deletedById: '$deleted.by' },
                pipeline: [
                    { $match: { $expr: { $eq: ['$_id', '$$deletedById'] } } },
                    { $project: { password: 0, deleted: 0 } }
                ],
                as: 'deletedByUser'
            }
        },
        {
            $unwind: {
                path: '$deletedByUser',
                preserveNullAndEmptyArrays: true
            }
        }
    ]

    const postLookupMatch = {}
    if (company) postLookupMatch['company.name'] = { $regex: company, $options: 'i' }
    if (contact) postLookupMatch['contact.name'] = { $regex: contact, $options: 'i' }
    if (Object.keys(postLookupMatch).length > 0) {
        pipeline.push({ $match: postLookupMatch })
    }

    pipeline.push({
        $group: {
            _id: '$company._id',
            companyDetails: { $first: '$company' },
            matchedCount: { $sum: 1 },
            maxDeletedAt: { $max: '$deleted.at' },
            maxCreatedAt: { $max: '$createdAt' }
        }
    })

    let sortField
    if (sort === 'deleted.at') sortField = 'maxDeletedAt'
    else if (sort === 'createdAt') sortField = 'maxCreatedAt'
    else sortField = 'matchedCount'

    const sortOrder = order === 'asc' ? 1 : -1

    pipeline.push({
        $facet: {
            data: [
                { $sort: { [sortField]: sortOrder } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                    $lookup: {
                        from: `${tenantId}_prospectuses`,
                        let: { companyId: '$_id' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $and: [
                                            { $eq: ['$company', '$$companyId'] },
                                            { $eq: ['$deleted.isDeleted', true] }
                                        ]
                                    }
                                }
                            },
                            {
                                $lookup: {
                                    from: `${tenantId}_contactprospectuses`,
                                    let: { contactId: '$contact' },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ['$_id', '$$contactId'] } } }
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
                                    from: `${tenantId}_users`,
                                    let: { deletedById: '$deleted.by' },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ['$_id', '$$deletedById'] } } },
                                        { $project: { _id: 1, firstName: 1, lastName: 1, email: 1, role: 1 } }
                                    ],
                                    as: 'deletedByUser'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$deletedByUser',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $lookup: {
                                    from: `${tenantId}_users`,
                                    let: { createdById: '$createdBy' },
                                    pipeline: [
                                        { $match: { $expr: { $eq: ['$_id', '$$createdById'] } } },
                                        { $project: { _id: 1, firstName: 1, lastName: 1, email: 1 } }
                                    ],
                                    as: 'createdBy'
                                }
                            },
                            {
                                $unwind: {
                                    path: '$createdBy',
                                    preserveNullAndEmptyArrays: true
                                }
                            },
                            {
                                $addFields: {
                                    'deleted.by': '$deletedByUser'
                                }
                            },
                            { $sort: { 'deleted.at': -1 } },
                            {
                                $project: {
                                    deletedByUser: 0
                                }
                            }
                        ],
                        as: 'prospectuses'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: '$companyDetails',
                        prospectuses: 1
                    }
                }
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    })

    const result = await Prospectus.aggregate(pipeline)
    const companies = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        prospectuses: companies,
        info: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasMoreRecords: page < totalPages
        }
    }
}

module.exports = {
    getArchivedLeads,
    getArchivedLeadById,

    getArchivedPipelines,
    getArchivedPipelineById,

    getArchivedCallLogs,
    getArchivedCallLogById,
    getDroppedLeads,
    getDroppedLeadById,
    getArchivedProspectuses
}