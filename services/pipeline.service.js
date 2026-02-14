const mongoose = require("mongoose")
const { ERROR_CODES } = require("../constants/error.constant")
const ConflictError = require("../errors/ConflictError")
const NotFoundError = require("../errors/NotFoundError")
const pipelineModel = require("../models/pipeline.model")
const companyLeadModel = require("../models/companyLead.model")
const { S3_BASE_URL } = require("../constants/s3.constant")
const { uploadToS3, deleteFromS3 } = require("../services/s3.service")


/**
 * Create a new pipeline
 */
const createPipeline = async (tenantId, pipelineData, proposalDocument) => {
    const Pipeline = pipelineModel(tenantId)
    const CompanyLead = companyLeadModel(tenantId)

    const session = await mongoose.startSession()
    session.startTransaction()
    let uploadedS3Key = null

    try {
        // Validation: Proposal phase requires number and document
        if (pipelineData.opportunityStage === 'proposal') {
            if (!pipelineData.proposalNumber) {
                throw new Error('Proposal number is required when opportunity stage is proposal')
            }
            if (!proposalDocument) {
                throw new Error('Proposal document is required when opportunity stage is proposal')
            }
        }

        const existingPipeline = await Pipeline.findOne({
            company: pipelineData.company,
            'deleted.isDeleted': false
        }).session(session)

        if (existingPipeline) {
            throw new ConflictError(
                409,
                'Pipeline already exists for this company',
                ERROR_CODES.PIPELINE_ALREADY_EXISTS,
                'conflict'
            )
        }

        const company = await CompanyLead.findOne({
            _id: pipelineData.company,
            'deleted.isDeleted': false
        }).session(session)

        if (!company) {
            throw new NotFoundError(
                404,
                'Company not found',
                ERROR_CODES.COMPANY_NOT_FOUND,
                'not_found'
            )
        }

        let documentData = undefined
        if (proposalDocument) {
            uploadedS3Key = await uploadToS3(proposalDocument)
            documentData = {
                originalname: proposalDocument.originalname,
                size: proposalDocument.size,
                mimetype: proposalDocument.mimetype,
                s3Url: S3_BASE_URL + uploadedS3Key
            }
        }

        const [pipeline] = await Pipeline.create([{
            ...pipelineData,
            proposalDocument: documentData
        }], { session })

        await session.commitTransaction()
        session.endSession()

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
    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        if (uploadedS3Key) {
            await deleteFromS3(uploadedS3Key).catch(err => console.error('Failed to cleanup S3 upload on error:', err))
        }

        throw error
    }
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

const updatePipelineById = async (tenantId, pipelineId, pipelineData, proposalDocument) => {
    const Pipeline = pipelineModel(tenantId)

    const session = await mongoose.startSession()
    session.startTransaction()
    let newS3Key = null
    let oldS3Key = null

    try {
        const pipeline = await Pipeline.findOne({
            _id: pipelineId,
            'deleted.isDeleted': false
        }).session(session)

        if (!pipeline) {
            throw new NotFoundError(
                404,
                'Pipeline not found',
                ERROR_CODES.PIPELINE_NOT_FOUND,
                'not_found'
            )
        }

        const effectiveStage = pipelineData.opportunityStage || pipeline.opportunityStage
        const effectiveNumber = pipelineData.proposalNumber || pipeline.proposalNumber
        const hasExistingDoc = pipeline.proposalDocument && pipeline.proposalDocument.s3Url

        // Validation: Proposal phase requires number and document
        if (effectiveStage === 'proposal') {
            if (!effectiveNumber) {
                throw new Error('Proposal number is required when opportunity stage is proposal')
            }
            if (!proposalDocument && !hasExistingDoc) {
                throw new Error('Proposal document is required when opportunity stage is proposal')
            }
        }

        // Handle file upload
        if (proposalDocument) {
            newS3Key = await uploadToS3(proposalDocument)

            if (hasExistingDoc) {
                oldS3Key = pipeline.proposalDocument.s3Url.replace(S3_BASE_URL, '')
            }

            pipelineData.proposalDocument = {
                originalname: proposalDocument.originalname,
                size: proposalDocument.size,
                mimetype: proposalDocument.mimetype,
                s3Url: S3_BASE_URL + newS3Key
            }
        }

        const allowedFields = [
            'opportunityStage',
            'estimatedValue',
            'probability',
            'expectedRevnue',
            'nextStep',
            'followUp',
            'remarks',
            'proposalNumber',
            'proposalDocument'
        ]

        allowedFields.forEach(field => {
            if (pipelineData[field] !== undefined) {
                pipeline[field] = pipelineData[field]
            }
        })

        await pipeline.save({ session })
        await session.commitTransaction()
        session.endSession()

        // Cleanup old file after successful commit
        if (oldS3Key) {
            await deleteFromS3(oldS3Key).catch(err => console.error('Failed to delete old S3 file:', err))
        }

        const result = await Pipeline.aggregate([
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(pipeline._id)
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

    } catch (error) {
        await session.abortTransaction()
        session.endSession()

        if (newS3Key) {
            await deleteFromS3(newS3Key).catch(err => console.error('Failed to cleanup new S3 upload on error:', err))
        }

        throw error
    }
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

const restorePipelineById = async (tenantId, userId, id) => {
    const Pipeline = pipelineModel(tenantId)

    const result = await Pipeline.updateOne({
        _id: id,
        'deleted.isDeleted': true
    }, {
        $set: {
            'deleted.isDeleted': false,
            'deleted.restoredAt': new Date(),
            'deleted.restoredBy': userId
        }
    })

    if (result.modifiedCount === 0) {
        throw new NotFoundError(
            404,
            'Pipeline not found',
            ERROR_CODES.PIPELINE_NOT_FOUND,
            'not_found'
        )
    }

    return result
}

const searchCompanyForPipeline = async (tenantId, search) => {
    const CompanyLead = companyLeadModel(tenantId)

    const companies = await CompanyLead.aggregate([
        /* -------------------- Base company filter -------------------- */
        {
            $match: {
                'deleted.isDeleted': false,
                ...(search && {
                    name: { $regex: search, $options: 'i' }
                })
            }
        },

        /* -------------------- Lookup qualifying leads -------------------- */
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
    createPipeline,
    getAllPipelines,
    getPipelineById,
    updatePipelineById,
    deletePipelineById,
    restorePipelineById,
    searchCompanyForPipeline
}