/**
 * Common Aggregate Repository
 *
 * This file contains reusable aggregation pipeline stages
 * to avoid code duplication across service files.
 */

/**
 * Create a company lookup stage with deleted filter
 * @param {string} tenantId - Tenant identifier
 * @param {object} options - Additional options
 * @returns {object[]} Array of aggregation stages
 */
const companyLookupStage = (tenantId, options = {}) => {
    const {
        localField = 'company',
        as = 'company',
        preserveNull = true,
        includeProject = true
    } = options

    const stages = [
        {
            $lookup: {
                from: `${tenantId}_companyleads`,
                let: { companyId: `$${localField}` },
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
                    ...(includeProject ? [{ $project: { deleted: 0 } }] : [])
                ],
                as
            }
        }
    ]

    if (!preserveNull) {
        stages.push({
            $unwind: {
                path: `$${as}`,
                preserveNullAndEmptyArrays: false
            }
        })
    } else {
        stages.push({
            $unwind: {
                path: `$${as}`,
                preserveNullAndEmptyArrays: true
            }
        })
    }

    return stages
}

/**
 * Create a contact lookup stage with deleted filter
 * @param {string} tenantId - Tenant identifier
 * @param {object} options - Additional options
 * @returns {object[]} Array of aggregation stages
 */
const contactLookupStage = (tenantId, options = {}) => {
    const {
        localField = 'contact',
        as = 'contact',
        preserveNull = true,
        includeProject = true
    } = options

    const stages = [
        {
            $lookup: {
                from: `${tenantId}_contactleads`,
                let: { contactId: `$${localField}` },
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
                    ...(includeProject ? [{ $project: { deleted: 0 } }] : [])
                ],
                as
            }
        },
        {
            $unwind: {
                path: `$${as}`,
                preserveNullAndEmptyArrays: preserveNull
            }
        }
    ]

    return stages
}

/**
 * Create a lead lookup stage with contact enrichment
 * @param {string} tenantId - Tenant identifier
 * @param {object} options - Additional options
 * @returns {object[]} Array of aggregation stages
 */
const leadLookupStage = (tenantId, options = {}) => {
    const {
        matchConditions = {},
        as = 'leads',
        includeContactInfo = true,
        sortBy = { createdAt: -1 }
    } = options

    const pipeline = [
        {
            $match: {
                $expr: {
                    $and: [
                        { $eq: ['$deleted.isDeleted', false] },
                        ...Object.entries(matchConditions).map(([key, value]) => ({
                            $eq: [key, value]
                        }))
                    ]
                }
            }
        }
    ]

    if (includeContactInfo) {
        pipeline.push(
            ...contactLookupStage(tenantId, {
                localField: 'contact',
                as: 'contact',
                preserveNull: true
            }),
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
            }
        )
    }

    if (sortBy) {
        pipeline.push({ $sort: sortBy })
    }

    return {
        $lookup: {
            from: `${tenantId}_leads`,
            let: options.let || {},
            pipeline,
            as
        }
    }
}

/**
 * Create a company leads lookup (other leads in the same company)
 * @param {string} tenantId - Tenant identifier
 * @param {object} options - Additional options
 * @returns {object[]} Array of aggregation stages
 */
const companyLeadsLookupStage = (tenantId, options = {}) => {
    const {
        companyIdPath = '$lead.company._id',
        currentLeadIdPath = '$lead._id',
        as = 'lead.company.leads',
        includeContactInfo = true,
        sortBy = { createdAt: -1 },
        allowDropped = false
    } = options

    const matchConditions = [
        { $eq: ['$company', '$$companyId'] },
        { $eq: ['$deleted.isDeleted', false] },
        { $ne: ['$_id', '$$currentLeadId'] }
    ]

    if (!allowDropped) {
        matchConditions.push({ $ne: ['$status', 'dropped'] })
    }

    return [
        {
            $lookup: {
                from: `${tenantId}_leads`,
                let: {
                    companyId: companyIdPath,
                    currentLeadId: currentLeadIdPath
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: matchConditions
                            }
                        }
                    },
                    ...(includeContactInfo ? [
                        ...contactLookupStage(tenantId, {
                            localField: 'contact',
                            as: 'contact',
                            preserveNull: true
                        }),
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
                        }
                    ] : []),
                    { $sort: sortBy }
                ],
                as
            }
        },
        {
            $addFields: {
                [as]: {
                    $cond: {
                        if: { $eq: [{ $size: `$${as}` }, 0] },
                        then: null,
                        else: `$${as}`
                    }
                }
            }
        }
    ]
}

/**
 * Create a facet stage for pagination
 * @param {object} options - Pagination options
 * @returns {object} Facet stage
 */
const paginationFacetStage = (options = {}) => {
    const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        additionalStages = []
    } = options

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    return {
        $facet: {
            data: [
                { $sort: { [sort]: sortOrder } },
                { $skip: skip },
                { $limit: Number(limit) },
                ...additionalStages
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    }
}

/**
 * Format pagination result
 * @param {object[]} result - Aggregation result with facet
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {object} Formatted result with info
 */
const formatPaginationResult = (result, page, limit) => {
    const data = result[0]?.data || []
    const total = result[0]?.totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        data,
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
 * Create a base match stage for non-deleted documents
 * @param {object} additionalConditions - Additional match conditions
 * @returns {object} Match stage
 */
const deletedFilterStage = (additionalConditions = {}) => {
    return {
        $match: {
            'deleted.isDeleted': false,
            ...additionalConditions
        }
    }
}

/**
 * Create projection stage to remove deleted field
 * @param {object} additionalProjections - Additional projection fields
 * @returns {object} Project stage
 */
const removeDeletedFieldStage = (additionalProjections = {}) => {
    return {
        $project: {
            deleted: 0,
            ...additionalProjections
        }
    }
}

/**
 * Enrich lead with contact information
 * @returns {object[]} Array of stages to add contact fields to lead
 */
const enrichLeadWithContactStage = () => {
    return [
        {
            $addFields: {
                'lead.name': '$lead.contact.name',
                'lead.email': '$lead.contact.email',
                'lead.phone': '$lead.contact.phone'
            }
        },
        {
            $project: {
                'lead.contact': 0
            }
        }
    ]
}

module.exports = {
    companyLookupStage,
    contactLookupStage,
    leadLookupStage,
    companyLeadsLookupStage,
    paginationFacetStage,
    formatPaginationResult,
    deletedFilterStage,
    removeDeletedFieldStage,
    enrichLeadWithContactStage
}
