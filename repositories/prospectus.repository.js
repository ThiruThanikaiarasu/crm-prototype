const mongoose = require('mongoose')
const prospectusModel = require('../models/prospectus.model')
const userModel = require('../models/user.model')
const { formatPaginationResult } = require('./aggregate.repository')

// Prospectus-specific lookup helpers (reference prospectus collections, not lead collections)

const companyProspectusLookupStage = (tenantId, options = {}) => {
    const {
        localField = 'company',
        as = 'company',
        preserveNull = true
    } = options

    return [
        {
            $lookup: {
                from: `${tenantId}_companyprospectuses`,
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
                    { $project: { deleted: 0 } }
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
}

const contactProspectusLookupStage = (tenantId, options = {}) => {
    const {
        localField = 'contact',
        as = 'contact',
        preserveNull = true
    } = options

    return [
        {
            $lookup: {
                from: `${tenantId}_contactprospectuses`,
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
                    { $project: { deleted: 0 } }
                ],
                as
            }
        },
        {
            $unwind: {
                path: `$${as}`,
                preserveNullAndEmptyArrays: true
            }
        }
    ]
}

const companyProspectusLeadsLookupStage = (tenantId, options = {}) => {
    const {
        companyIdPath = '$company._id',
        currentProspectusIdPath = '$_id',
        as = 'company.prospectuses'
    } = options

    return [
        {
            $lookup: {
                from: `${tenantId}_prospectuses`,
                let: {
                    companyId: companyIdPath,
                    currentId: currentProspectusIdPath
                },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$company', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] },
                                    { $ne: ['$_id', '$$currentId'] }
                                ]
                            }
                        }
                    },
                    ...contactProspectusLookupStage(tenantId, {
                        localField: 'contact',
                        as: 'contact',
                        preserveNull: true
                    }),
                    {
                        $project: { deleted: 0 }
                    },
                    { $sort: { createdAt: -1 } }
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
 * Get prospectus by ID with populated company and contact
 */
const getProspectusById = async (tenantId, id, userRole = null) => {
    const Prospectus = prospectusModel(tenantId)
    const ROLES = require('../constants/role.constant')

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
                'deleted.isDeleted': false
            }
        },
        ...companyProspectusLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        ...companyProspectusLeadsLookupStage(tenantId, {
            companyIdPath: '$company._id',
            currentProspectusIdPath: '$_id',
            as: 'company.prospectuses'
        }),
        ...contactProspectusLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        })
    ]

    if (userRole === ROLES.SUPER_ADMIN) {
        pipeline.push(
            {
                $lookup: {
                    from: `${tenantId}_users`,
                    let: { createdById: '$createdBy' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$createdById'] }
                            }
                        },
                        {
                            $project: { firstName: 1, lastName: 1, email: 1 }
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
            $project: {
                deleted: 0
            }
        }
    )

    const result = await Prospectus.aggregate(pipeline)
    return result.length > 0 ? result[0] : null
}

/**
 * Get all prospectuses with pagination and filters
 */
const getAllProspectusWithPagination = async (tenantId, filters = {}, userRole = null) => {
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

    if (owner && userRole !== ROLES.SUPER_ADMIN) {
        throw new ForbiddenError(
            403,
            'Only super admin can filter by owner',
            ERROR_CODES.FORBIDDEN_ACCESS,
            'forbidden'
        )
    }

    const Prospectus = prospectusModel(tenantId)
    const skip = (page - 1) * limit

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
        matchConditions.createdBy = userIds.length > 0 ? { $in: userIds } : { $in: [] }
    }

    const pipeline = [
        { $match: matchConditions },
        ...companyProspectusLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        ...contactProspectusLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        })
    ]

    const postLookupMatch = {}
    if (company) postLookupMatch['company.name'] = { $regex: company, $options: 'i' }
    if (contact) postLookupMatch['contact.name'] = { $regex: contact, $options: 'i' }
    if (serviceType && Array.isArray(serviceType) && serviceType.length > 0) {
        postLookupMatch['company.serviceType'] = { $in: serviceType }
    }

    if (Object.keys(postLookupMatch).length > 0) {
        pipeline.push({ $match: postLookupMatch })
    }

    pipeline.push(
        {
            $addFields: {
                statusOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$status', 'new'] }, then: 0 },
                            { case: { $eq: ['$status', 'qualified'] }, then: 1 }
                        ],
                        default: 2
                    }
                }
            }
        },
        {
            $group: {
                _id: '$company._id',
                companyDetails: { $first: '$company' },
                matchedCount: { $sum: 1 },
                maxCreatedAt: { $max: '$createdAt' },
                companyNameLower: { $first: { $toLower: '$company.name' } },
                contactFirstNameLower: { $first: { $toLower: '$contact.name' } },
                minStatusOrder: { $max: '$statusOrder' }
            }
        }
    )

    let sortField = 'maxCreatedAt'
    if (sort === 'matchedCount') sortField = 'matchedCount'
    else if (sort === 'company') sortField = 'companyNameLower'
    else if (sort === 'contact') sortField = 'contactFirstNameLower'

    const sortOrder = order === 'asc' ? 1 : -1

    const nestedAndConditions = [
        { $eq: ['$company', '$$companyId'] },
        { $eq: ['$deleted.isDeleted', false] }
    ]

    const nestedMatchConditions = {
        $expr: { $and: nestedAndConditions }
    }

    if (matchConditions.createdBy) nestedMatchConditions.createdBy = matchConditions.createdBy
    if (matchConditions.status) nestedMatchConditions.status = matchConditions.status
    if (matchConditions.source) nestedMatchConditions.source = matchConditions.source
    if (matchConditions.priority) nestedMatchConditions.priority = matchConditions.priority
    if (matchConditions.followUp) nestedMatchConditions.followUp = matchConditions.followUp

    const nestedLookupPipeline = [
        { $match: nestedMatchConditions },
        ...contactProspectusLookupStage(tenantId, {
            localField: 'contact',
            as: 'contact',
            preserveNull: true
        })
    ]

    if (userRole === ROLES.SUPER_ADMIN) {
        nestedLookupPipeline.push(
            {
                $lookup: {
                    from: `${tenantId}_users`,
                    let: { createdById: '$createdBy' },
                    pipeline: [
                        {
                            $match: {
                                $expr: { $eq: ['$_id', '$$createdById'] }
                            }
                        },
                        {
                            $project: { firstName: 1, lastName: 1, email: 1 }
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

    nestedLookupPipeline.push(
        {
            $addFields: {
                statusOrder: {
                    $switch: {
                        branches: [
                            { case: { $eq: ['$status', 'new'] }, then: 0 },
                            { case: { $eq: ['$status', 'qualified'] }, then: 1 }
                        ],
                        default: 2
                    }
                }
            }
        },
        { $sort: { statusOrder: 1, createdAt: -1 } },
        {
            $project: {
                deleted: 0,
                statusOrder: 0
            }
        }
    )

    pipeline.push({
        $facet: {
            data: [
                { $sort: { minStatusOrder: 1, [sortField]: sortOrder } },
                { $skip: skip },
                { $limit: Number(limit) },
                {
                    $lookup: {
                        from: `${tenantId}_prospectuses`,
                        let: { companyId: '$_id' },
                        pipeline: nestedLookupPipeline,
                        as: 'prospectuses'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: {
                            $mergeObjects: ['$companyDetails', { deleted: '$$REMOVE' }]
                        },
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
    const formatted = formatPaginationResult(result, page, limit)

    return {
        prospectuses: formatted.data,
        info: formatted.info
    }
}

module.exports = {
    getProspectusById,
    getAllProspectusWithPagination
}
