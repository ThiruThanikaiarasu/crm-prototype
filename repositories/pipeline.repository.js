const mongoose = require('mongoose')
const pipelineModel = require('../models/pipeline.model')
const companyLeadModel = require('../models/companyLead.model')
const {
    companyLookupStage,
    paginationFacetStage,
    formatPaginationResult,
    deletedFilterStage
} = require('./aggregate.repository')

/**
 * Get pipeline by ID with company details
 * @param {string} tenantId
 * @param {string} pipelineId
 * @returns {Promise<object|null>}
 */
const getPipelineByIdWithDetails = async (tenantId, pipelineId) => {
    const Pipeline = pipelineModel(tenantId)

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(pipelineId),
                'deleted.isDeleted': false
            }
        },
        ...companyLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        {
            $project: {
                deleted: 0
            }
        }
    ]

    const result = await Pipeline.aggregate(pipeline)
    return result[0] || null
}

/**
 * Get all pipelines with pagination and filters
 * @param {string} tenantId
 * @param {object} filters
 * @returns {Promise<object>}
 */
const getAllPipelinesWithPagination = async (tenantId, filters = {}) => {
    const {
        page = 1,
        limit = 10,
        opportunityStage,
        owner,
        company,
        sort = 'createdAt',
        order = 'desc'
    } = filters

    const Pipeline = pipelineModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    if (opportunityStage) matchStage.opportunityStage = opportunityStage
    if (owner) matchStage.owner = new mongoose.Types.ObjectId(owner)
    if (company) matchStage.company = new mongoose.Types.ObjectId(company)

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    // Get total count
    const total = await Pipeline.countDocuments(matchStage)

    // Get paginated data
    const pipelines = await Pipeline.aggregate([
        { $match: matchStage },
        ...companyLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        {
            $project: {
                deleted: 0
            }
        },
        { $sort: { [sort]: sortOrder } },
        { $skip: skip },
        { $limit: Number(limit) }
    ])

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
 * Get pipeline with company details after creation/update
 * @param {string} tenantId
 * @param {object} pipelineId
 * @returns {Promise<object|null>}
 */
const getPipelineWithCompanyDetails = async (tenantId, pipelineId) => {
    const Pipeline = pipelineModel(tenantId)

    const result = await Pipeline.aggregate([
        {
            $match: {
                _id: pipelineId
            }
        },
        ...companyLookupStage(tenantId, {
            localField: 'company',
            as: 'company',
            preserveNull: false
        }),
        {
            $project: {
                deleted: 0
            }
        }
    ])

    return result[0] || null
}

/**
 * Search companies with qualifying leads for pipeline
 * @param {string} tenantId
 * @param {string} search
 * @returns {Promise<object[]>}
 */
const searchCompaniesForPipeline = async (tenantId, search) => {
    const CompanyLead = companyLeadModel(tenantId)

    const companies = await CompanyLead.aggregate([
        {
            $match: {
                'deleted.isDeleted': false,
                ...(search && {
                    name: { $regex: search, $options: 'i' }
                })
            }
        },
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
                                    { $eq: ['$deleted.isDeleted', false] },
                                    {
                                        $in: [
                                            '$status',
                                            ['promoted_to_meeting', 'conversion_in_progress']
                                        ]
                                    }
                                ]
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            status: 1
                        }
                    }
                ],
                as: 'activeLeads'
            }
        },
        {
            $match: {
                'activeLeads.0': { $exists: true }
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                activeLeads: 1
            }
        }
    ])

    return companies
}

module.exports = {
    getPipelineByIdWithDetails,
    getAllPipelinesWithPagination,
    getPipelineWithCompanyDetails,
    searchCompaniesForPipeline
}
