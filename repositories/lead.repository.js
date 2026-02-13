const mongoose = require('mongoose')
const leadModel = require('../models/lead.model')
const {
    companyLookupStage,
    contactLookupStage,
    companyLeadsLookupStage,
    paginationFacetStage,
    formatPaginationResult,
    deletedFilterStage,
    enrichLeadWithContactStage
} = require('./aggregate.repository')

/**
 * Get lead by ID with populated company and contact
 * @param {string} tenantId
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getLeadByIdWithDetails = async (tenantId, id) => {
    const Lead = leadModel(tenantId)

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': false
            }
        },
        ...companyLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        ...companyLeadsLookupStage(tenantId, {
            companyIdPath: '$company._id',
            currentLeadIdPath: '$_id',
            as: 'company.leads'
        }),
        ...contactLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        }),
        {
            $lookup: {
                from: `${tenantId}_users`,
                let: { ownerId: '$owner' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$ownerId']
                            }
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
                let: { createdById: '$createdBy' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $eq: ['$_id', '$$createdById']
                            }
                        }
                    },
                    {
                        $project: {
                            firstName: 1,
                            lastName: 1,
                            email: 1
                        }
                    }
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
                name: '$contact.name',
                email: '$contact.email',
                phone: '$contact.phone',
                department: '$contact.department',
                remarks: '$contact.remarks'
            }
        },
        {
            $project: {
                deleted: 0,
                contact: 0
            }
        }
    ]

    const result = await Lead.aggregate(pipeline)
    return result.length > 0 ? result[0] : null
}

/**
 * Get all leads with pagination and filters
 * @param {string} tenantId
 * @param {object} filters
 * @returns {Promise<object>}
 */
const getAllLeadsWithPagination = async (tenantId, filters = {}) => {
    const {
        page = 1,
        limit = 10,
        contact,
        company,
        status,
        source,
        sort = 'createdAt',
        order = 'desc',
        followUp,
        priority,
        serviceType
    } = filters

    const Lead = leadModel(tenantId)
    const skip = (page - 1) * limit

    // Build initial match conditions
    const matchConditions = {
        'deleted.isDeleted': false
    }

    if (status) matchConditions.status = status
    if (source) {
        matchConditions.source = {
            $regex: new RegExp(source, 'i'),
            $ne: null
        }
    }
    if (followUp) {
        const startOfDay = new Date(followUp)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(followUp)
        endOfDay.setHours(23, 59, 59, 999)
        matchConditions.followUp = {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }
    if (priority) matchConditions.priority = Number(priority)

    const pipeline = [
        { $match: matchConditions },
        ...companyLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        ...contactLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        })
    ]

    // Post-lookup filters
    const postLookupMatch = {}
    if (company) postLookupMatch['company.name'] = { $regex: company, $options: 'i' }
    if (contact) postLookupMatch['contact.name'] = { $regex: contact, $options: 'i' }
    if (serviceType && Array.isArray(serviceType) && serviceType.length > 0) {
        postLookupMatch['company.serviceType'] = { $in: serviceType }
    }

    if (Object.keys(postLookupMatch).length > 0) {
        pipeline.push({ $match: postLookupMatch })
    }

    // Group by company
    pipeline.push({
        $group: {
            _id: '$company._id',
            companyDetails: { $first: '$company' },
            matchedLeadsCount: { $sum: 1 },
            maxCreatedAt: { $max: '$createdAt' },
            companyNameLower: { $first: { $toLower: '$company.name' } },
            contactFirstNameLower: { $first: { $toLower: '$contact.name' } }
        }
    })

    // Determine sort field
    let sortField = 'maxCreatedAt'
    if (sort === 'matchedLeadsCount') sortField = 'matchedLeadsCount'
    else if (sort === 'company') sortField = 'companyNameLower'
    else if (sort === 'contact') sortField = 'contactFirstNameLower'

    const sortOrder = order === 'asc' ? 1 : -1

    pipeline.push({
        $facet: {
            data: [
                { $sort: { [sortField]: sortOrder } },
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
                                            { $eq: ['$deleted.isDeleted', false] }
                                        ]
                                    }
                                }
                            },
                            ...contactLookupStage(tenantId, {
                                localField: 'contact',
                                as: 'contact',
                                preserveNull: true
                            }),
                            {
                                $lookup: {
                                    from: `${tenantId}_users`,
                                    let: { createdById: '$createdBy' },
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$_id', '$$createdById']
                                                }
                                            }
                                        },
                                        {
                                            $project: {
                                                firstName: 1,
                                                lastName: 1,
                                                email: 1
                                            }
                                        }
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
                                    name: '$contact.name',
                                    email: '$contact.email',
                                    phone: '$contact.phone',
                                    department: '$contact.department',
                                    remarks: '$contact.remarks'
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            {
                                $project: {
                                    deleted: 0,
                                    contact: 0
                                }
                            }
                        ],
                        as: 'leads'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: {
                            $mergeObjects: ['$companyDetails', { deleted: '$$REMOVE' }]
                        },
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
    const formatted = formatPaginationResult(result, page, limit)

    return {
        leads: formatted.data,
        info: formatted.info
    }
}

module.exports = {
    getLeadByIdWithDetails,
    getAllLeadsWithPagination
}
