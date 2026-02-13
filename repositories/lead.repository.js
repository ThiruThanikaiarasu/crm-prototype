const mongoose = require('mongoose')
const leadModel = require('../models/lead.model')
const userModel = require('../models/user.model')
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
 * @param {string} userRole - User role to determine if createdBy should be populated
 * @returns {Promise<object|null>}
 */
const getLeadByIdWithDetails = async (tenantId, id, userRole = null) => {
    const Lead = leadModel(tenantId)
    const ROLES = require('../constants/role.constant')

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
        }
    ]

    // Only add createdBy lookup if user is super_admin
    if (userRole === ROLES.SUPER_ADMIN) {
        pipeline.push(
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
            }
        )
    }

    pipeline.push(
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
    )

    const result = await Lead.aggregate(pipeline)
    return result.length > 0 ? result[0] : null
}

/**
 * Get all leads with pagination and filters
 * @param {string} tenantId
 * @param {object} filters
 * @param {string} userRole - User role to determine permissions
 * @returns {Promise<object>}
 */
const getAllLeadsWithPagination = async (tenantId, filters = {}, userRole = null) => {
    const ForbiddenError = require('../errors/ForbiddenError')
    const { ERROR_CODES } = require('../constants/error.constant')
    const ROLES = require('../constants/role.constant')

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
        serviceType,
        owner
    } = filters

    // Check if owner filter is used and validate user role
    if (owner && userRole !== ROLES.SUPER_ADMIN) {
        throw new ForbiddenError(
            403,
            'Only super admin can filter by owner',
            ERROR_CODES.FORBIDDEN_ACCESS,
            'forbidden'
        )
    }

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
    if (owner && userRole === ROLES.SUPER_ADMIN) {
        const User = userModel(tenantId)
        const users = await User.find({
            $or: [
                { firstName: { $regex: new RegExp(owner, 'i') } },
                { lastName: { $regex: new RegExp(owner, 'i') } }
            ]
        }).select('_id')

        const userIds = users.map(user => user._id)

        if (userIds.length > 0) {
            matchConditions.createdBy = { $in: userIds }
        } else {
            // If no users match, ensure no leads are returned
            matchConditions.createdBy = { $in: [] }
        }
    }

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

    // Build the nested leads lookup pipeline
    // Build the nested leads lookup pipeline
    const nestedMatchConditions = {
        $expr: {
            $and: [
                { $eq: ['$company', '$$companyId'] },
                { $eq: ['$deleted.isDeleted', false] }
            ]
        }
    }

    if (matchConditions.createdBy) {
        nestedMatchConditions.createdBy = matchConditions.createdBy
    }

    const leadsLookupPipeline = [
        {
            $match: nestedMatchConditions
        },
        ...contactLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        })
    ]

    // Only add createdBy lookup if user is super_admin
    if (userRole === ROLES.SUPER_ADMIN) {
        leadsLookupPipeline.push(
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
            }
        )
    }

    leadsLookupPipeline.push(
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
    )

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
                        pipeline: leadsLookupPipeline,
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
