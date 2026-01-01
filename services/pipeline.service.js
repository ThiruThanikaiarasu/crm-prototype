const mongoose = require("mongoose")
const { ERROR_CODES } = require("../constants/error.constant")
const ConflictError = require("../errors/ConflictError")
const NotFoundError = require("../errors/NotFoundError")
const pipelineModel = require("../models/pipeline.model")
const companyLeadModel = require("../models/companyLead.model")

/**
 * Create a new pipeline
 */
const createPipeline = async (tenantId, pipelineData) => {
    const Pipeline = pipelineModel(tenantId)
    const CompanyLead = companyLeadModel(tenantId)

    // Check if pipeline already exists for this company
    const existingPipeline = await Pipeline.findOne({
        company: pipelineData.company,
        'deleted.isDeleted': false
    })

    if (existingPipeline) {
        throw new ConflictError(
            409,
            'Pipeline already exists for this company',
            ERROR_CODES.PIPELINE_ALREADY_EXISTS,
            'conflict'
        )
    }

    // Verify company exists
    const company = await CompanyLead.findOne({
        _id: pipelineData.company,
        'deleted.isDeleted': false
    })

    if (!company) {
        throw new NotFoundError(
            404,
            'Company not found',
            ERROR_CODES.COMPANY_NOT_FOUND,
            'not_found'
        )
    }

    // Create pipeline
    const pipeline = await Pipeline.create(pipelineData)

    // Return pipeline with company details
    const result = await Pipeline.aggregate([
        {
            $match: {
                _id: pipeline._id
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
            $unwind: '$company'
        },
        {
            $project: {
                deleted: 0
            }
        }
    ])

    return result[0] || null
}

/**
 * Get all pipelines with company details
 */
// const getAllPipelines = async (tenantId, filters = {}) => {
//     const Pipeline = pipelineModel(tenantId)

//     const matchStage = {
//         'deleted.isDeleted': false
//     }

//     // Add optional filters
//     if (filters.opportunityStage) {
//         matchStage.opportunityStage = filters.opportunityStage
//     }

//     if (filters.owner) {
//         matchStage.owner = new mongoose.Types.ObjectId(filters.owner)
//     }

//     if (filters.company) {
//         matchStage.company = new mongoose.Types.ObjectId(filters.company)
//     }

//     const pipelines = await Pipeline.aggregate([
//         {
//             $match: matchStage
//         },
//         {
//             $lookup: {
//                 from: `${tenantId}_companyleads`,
//                 let: { companyId: '$company' },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $and: [
//                                     { $eq: ['$_id', '$$companyId'] },
//                                     { $eq: ['$deleted.isDeleted', false] }
//                                 ]
//                             }
//                         }
//                     },
//                     { $project: { deleted: 0 } }
//                 ],
//                 as: 'company'
//             }
//         },
//         {
//             $unwind: {
//                 path: '$company',
//                 preserveNullAndEmptyArrays: false // Only return pipelines with valid companies
//             }
//         },
//         {
//             $project: {
//                 deleted: 0
//             }
//         },
//         {
//             $sort: { createdAt: -1 }
//         }
//     ])

//     return pipelines
// }

/**
 * Get all pipelines with company details, pagination, and info
 */
const getAllPipelines = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        opportunityStage,
        owner,
        company,
        sort = 'createdAt',
        order = 'desc'
    } = {}
) => {
    const Pipeline = pipelineModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    // Add optional filters
    if (opportunityStage) {
        matchStage.opportunityStage = opportunityStage
    }

    if (owner) {
        matchStage.owner = new mongoose.Types.ObjectId(owner)
    }

    if (company) {
        matchStage.company = new mongoose.Types.ObjectId(company)
    }

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    // Get total count
    const total = await Pipeline.countDocuments(matchStage)

    // Get paginated data
    const pipelines = await Pipeline.aggregate([
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
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project: {
                deleted: 0
            }
        },
        {
            $sort: { [sort]: sortOrder }
        },
        {
            $skip: skip
        },
        {
            $limit: Number(limit)
        }
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
 * Get pipeline by ID with company details
 */
const getPipelineById = async (tenantId, pipelineId) => {
    const Pipeline = pipelineModel(tenantId)

    const pipelines = await Pipeline.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(pipelineId),
                'deleted.isDeleted': false
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
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project: {
                deleted: 0
            }
        }
    ])

    return pipelines[0] || null
}

const updatePipelineById = async (tenantId, pipelineId, pipelineData) => {
    const Pipeline = pipelineModel(tenantId)

    const pipeline = await Pipeline.findOne({
        _id: pipelineId,
        'deleted.isDeleted': false
    })

    if (!pipeline) {
        throw new NotFoundError(
            404,
            'Pipeline not found',
            ERROR_CODES.PIPELINE_NOT_FOUND,
            'not_found'
        )
    }

    const allowedFields = [
        'opportunityStage',
        'estimatedValue',
        'probability',
        'expectedRevnue',
        'nextStep',
        'followUp',
        'remarks'
    ]

    allowedFields.forEach(field => {
        if (pipelineData[field] !== undefined) {
            pipeline[field] = pipelineData[field]
        }
    })

    await pipeline.save()

    const result = await Pipeline.aggregate([
        {
            $match: {
                _id: pipeline._id
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
                preserveNullAndEmptyArrays: false
            }
        },
        {
            $project: {
                deleted: 0
            }
        }
    ])

    return result[0] || null
}


const deletePipelineById = async (tenantId, userId, id) => {
    const Pipeline = pipelineModel(tenantId)

    const pipeline = await Pipeline.findOne({
        _id: id,
        'deleted.isDeleted': false
    })

    if (!pipeline) {
        throw new NotFoundError(
            404,
            'Pipeline not found',
            ERROR_CODES.PIPELINE_NOT_FOUND,
            'not_found'
        )
    }

    pipeline.deleted.isDeleted = true
    pipeline.deleted.at = new Date()
    pipeline.deleted.by = userId

    await pipeline.save()

    return pipeline
}

module.exports = {
    createPipeline,
    getAllPipelines,
    getPipelineById,
    updatePipelineById,
    deletePipelineById
}