const mongoose = require("mongoose");

const createCallLogSchema = (tenantId) => {
    const callLogSchema = new mongoose.Schema(
        {
            lead: {
                type: mongoose.Schema.Types.ObjectId,
                ref: `${tenantId}_leads`,
                required: [true, 'Lead is required']
            },
            outcome: {
                type: String,
                enum: ['interested', 'not_interested', 'contacted', 'done'],
                default: 'interested',
            },
            followUp: {
                type: Date,
                required: [true, 'Follow up date is required']
            },
            remarks: {
                type: String,
                required: [true, 'Remarks is required']
            },
            callStartTime: {
                type: Date,
                required: [true, 'Call start time is required']
            },
            callDuration: {
                type: Number,
                min: [0, 'Call duration cannot be negative'],
                required: [true, 'Call duration is required']
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

        },
        {
            timestamps: true,
            versionKey: false,
        }
    )

    callLogSchema.index(
        { lead: 1, 'deleted.isDeleted': 1 },
        { collation: { locale: 'ar', strength: 1 } }
    )

    callLogSchema.pre(/^find/, function () {
        this.where({ 'deleted.isDeleted': false })
    })

    return callLogSchema
}

const callLogModel = (tenantId) => {
    if (tenantId == null || tenantId == '') {
        throw new Error('Tenant id must be a value')
    }

    const collectionName = `${tenantId}_callLogs`

    if (mongoose.models[collectionName]) {
        return mongoose.models[collectionName]
    }

    const schema = createCallLogSchema(tenantId)
    return mongoose.model(collectionName, schema)
}

module.exports = callLogModel