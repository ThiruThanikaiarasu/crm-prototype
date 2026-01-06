const mongoose = require('mongoose')
const leadModel = require('../models/lead.model')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
// Import other models as needed (pipeline, calllog, etc.)

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

/**
 * Restore a deleted lead (and its contact)
 */
const restoreLeadById = async (tenantId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Lead = leadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)

        const lead = await Lead.findOne({
            _id: id,
            'deleted.isDeleted': true
        }).session(session)

        if (!lead) {
            throw new Error('Archived lead not found')
        }

        // Restore the lead
        lead.deleted = {
            isDeleted: false,
            at: null,
            by: null
        }
        await lead.save({ session })

        // Restore the contact if exists
        if (lead.contact) {
            await ContactLead.findByIdAndUpdate(
                lead.contact,
                {
                    $set: {
                        'deleted.isDeleted': false,
                        'deleted.at': null,
                        'deleted.by': null
                    }
                },
                { session }
            )
        }

        await session.commitTransaction()
        return true
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

/**
 * Permanently delete a lead (hard delete)
 */
const permanentlyDeleteLeadById = async (tenantId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Lead = leadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)

        const lead = await Lead.findOne({
            _id: id,
            'deleted.isDeleted': true
        }).session(session)

        if (!lead) {
            throw new Error('Archived lead not found')
        }

        // Permanently delete contact if exists
        if (lead.contact) {
            await ContactLead.findByIdAndDelete(lead.contact, { session })
        }

        // Permanently delete lead
        await Lead.findByIdAndDelete(id, { session })

        await session.commitTransaction()
        return true
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

module.exports = {
    getArchivedLeads,
    getArchivedLeadById,
    restoreLeadById,
    permanentlyDeleteLeadById
}