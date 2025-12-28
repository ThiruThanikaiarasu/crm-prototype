const mongoose = require("mongoose")
const { ERROR_CODES } = require("../constants/error.constant")
const ConflictError = require("../errors/ConflictError")
const leadModel = require("../models/lead.model")
const pipelineModel = require("../models/pipeline.model")

const createPipeline = async (tenantId, pipelineData) => {
    const Pipeline = pipelineModel(tenantId)
    const Lead = leadModel(tenantId)

    const existingPipeline = await Pipeline.findOne({ lead: pipelineData.lead })

    const leadAggregatePipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(pipelineData.lead)
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
                    {
                        $project: {
                            deleted: 0
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
                    {
                        $project: {
                            deleted: 0
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
            $project: {
                deleted: 0
            }
        }
    ]
    const leadData = await Lead.aggregate(leadAggregatePipeline)

    if (existingPipeline) {
        throw new ConflictError(
            409,
            'Pipeline already exists',
            ERROR_CODES.PIPELINE_ALREADY_EXISTS,
            'conflict'
        )
    }

    const pipeline = await Pipeline.create(pipelineData)

    const sanitizedData = {
        ...pipeline.toObject(),
        lead: leadData
    }

    return sanitizedData
}

const getAllPipelines = async (tenantId) => {
    const Pipeline = pipelineModel(tenantId)

    const pipelines = await Pipeline.aggregate([
        {
            $match: {
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
        {
            $unwind: '$lead'
        },
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
                    {
                        $project: {
                            deleted: 0
                        }
                    }
                ],
                as: 'lead.company'
            }
        },
        {
            $unwind: '$lead.company'
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
                    {
                        $project: {
                            deleted: 0
                        }
                    }
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
            $project: {
                deleted: 0,
                'lead.deleted': 0
            }
        }
    ])

    return pipelines
}

const getPipelineById = async (tenantId, pipelineId) => {
     const Pipeline = pipelineModel(tenantId)

    const pipelines = await Pipeline.aggregate([
        {
            $match: {
                'deleted.isDeleted': false,
                _id: new mongoose.Types.ObjectId(pipelineId)
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
        {
            $unwind: '$lead'
        },
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
                    {
                        $project: {
                            deleted: 0
                        }
                    }
                ],
                as: 'lead.company'
            }
        },
        {
            $unwind: '$lead.company'
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
                    {
                        $project: {
                            deleted: 0
                        }
                    }
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
            $project: {
                deleted: 0,
                'lead.deleted': 0
            }
        }
    ])

    return pipelines[0]
}

const updatePipelineById = async (tenantId, pipelineId, pipelineData) => {
    const Pipeline = pipelineModel(tenantId)
    const Lead = leadModel(tenantId)

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

    console.log(pipeline.lead)

    const leadAggregatePipeline = [
        {
            $match: {
                _id: pipeline.lead
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
        { $unwind: '$company' },
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
        { $project: { deleted: 0 } }
    ]

    const leadData = await Lead.aggregate(leadAggregatePipeline)

    Object.keys(pipelineData).forEach(key => {
        if (key !== 'lead' && pipelineData[key] !== undefined) {
            pipeline[key] = pipelineData[key]
        }
    })

    await pipeline.save()

    return {
        ...pipeline.toObject(),
        lead: leadData[0] || null
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

module.exports = {
    createPipeline,
    getAllPipelines,
    getPipelineById,
    updatePipelineById,
    deletePipelineById
}