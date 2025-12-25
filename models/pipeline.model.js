const mongoose = require('mongoose')

const createPipelineSchema = (tenantId) => {
    const pipelineSchema = new mongoose.Schema(
        {
            lead: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_leads`,
                required: [true, 'Lead is required']
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
                default: 0
            },
            expectedRevnue: {
                type: Number,
                default: 0
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
            },

        }
    )

    pipelineSchema.index(
        { lead: 1, 'deleted.isDeleted': 1 },
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
