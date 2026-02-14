const mongoose = require('mongoose')

const createPipelineSchema = (tenantId) => {
    const pipelineSchema = new mongoose.Schema(
        {
            company: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_companyleads`,
                required: [true, 'Company is required']
            },
            opportunityStage: {
                type: String,
                enum: ['lead', 'meeting', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
                default: 'lead',
            },
            estimatedValue: {
                type: Number,
                default: 0,
            },
            probability: {
                type: Number,
                default: 0,
                min: [0, 'Probability cannot be negative'],
                max: [100, 'Probability cannot exceed 100']
            },
            expectedRevnue: {
                type: Number,
                default: 0,
            },
            nextStep: {
                type: String,
                default: ''
            },
            followUp: {
                type: Date,
                default: null
            },
            remarks: {
                type: String,
                default: ''
            },
            proposalDocument: {
                originalname: {
                    type: String,
                    trim: true,
                },
                size: {
                    type: Number,
                },
                mimetype: {
                    type: String,
                    match: [
                        /^image\/(jpeg|png|gif|webp|svg\+xml)$/,
                        'Invalid MIME type. Allowed types are: jpeg, png, gif, webp, svg+xml'
                    ],
                },
                s3Url: {
                    type: String,
                    trim: true,
                },
                required: [(this.opportunityStage === 'proposal'), 'Proposal document is required when opportunity stage is proposal']
            },
            proposalNumber: {
                type: String,
                match: [
                    /^[a-zA-Z0-9]+$/,
                    'Only alphanumeric characters are allowed (A–Z, a–z, 0–9)'
                ],
                trim: true,
                required: [(this.opportunityStage === 'proposal'), 'Proposal number is required when opportunity stage is proposal']
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_users`,
                required: [true, 'Created by is required']
            },
            deleted: {
                isDeleted: {
                    type: Boolean,
                    default: false,
                    index: true,
                    select: false,
                },
                at: {
                    type: Date,
                    select: false,
                },
                by: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: `${tenantId}_users`,
                    select: false,
                },
                restoredAt: {
                    type: Date,
                    select: false,
                },
                restoredBy: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: `${tenantId}_users`,
                    select: false,
                }
            },
        },
        {
            timestamps: true,
            versionKey: false,
        }
    )

    pipelineSchema.index(
        { company: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    pipelineSchema.pre(/^find/, function() {
        this.where({'deleted.isDeleted': false})
    })

    return pipelineSchema
}

const pipelineModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_pipelines`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createPipelineSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = pipelineModel