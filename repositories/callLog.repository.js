const mongoose = require('mongoose')
const callLogModel = require('../models/callLog.model')
const {
    companyLookupStage,
    contactLookupStage,
    companyLeadsLookupStage,
    paginationFacetStage,
    formatPaginationResult,
    deletedFilterStage
} = require('./aggregate.repository')

/**
 * Get call log by ID with enriched lead, company and contact details
 * @param {string} tenantId
 * @param {string} id
 * @returns {Promise<object|null>}
 */
const getCallLogByIdWithDetails = async (tenantId, id) => {
    const CallLog = callLogModel(tenantId)

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
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
        { $unwind: '$lead' },
        ...buildLeadEnrichmentPipeline(tenantId),
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0,
                'lead.contact': 0
            }
        }
    ]

    const result = await CallLog.aggregate(pipeline)
    return result[0] || null
}

/**
 * Build lead enrichment pipeline (company + contact + other company leads)
 * @param {string} tenantId
 * @returns {object[]}
 */
const buildLeadEnrichmentPipeline = (tenantId) => {
    return [
        ...companyLookupStage(tenantId, {
            localField: 'lead.company',
            as: 'lead.company',
            preserveNull: true
        }),
        ...contactLookupStage(tenantId, {
            localField: 'lead.contact',
            as: 'lead.contact',
            preserveNull: true
        }),
        ...companyLeadsLookupStage(tenantId, {
            companyIdPath: '$lead.company._id',
            currentLeadIdPath: '$lead._id',
            as: 'lead.company.leads'
        }),
        {
            $addFields: {
                'lead.name': '$lead.contact.name',
                'lead.email': '$lead.contact.email',
                'lead.phone': '$lead.contact.phone'
            }
        }
    ]
}

/**
 * Get all call logs with pagination and filters
 * @param {string} tenantId
 * @param {object} filters
 * @returns {Promise<object>}
 */
const getAllCallLogsWithPagination = async (tenantId, filters = {}) => {
    const {
        page = 1,
        limit = 10,
        lead,
        outcome,
        followUp,
        remarks,
        sort = 'createdAt',
        order = 'desc'
    } = filters

    const CallLog = callLogModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    if (lead) matchStage.lead = new mongoose.Types.ObjectId(lead)
    if (remarks) matchStage.remarks = { $regex: remarks, $options: 'i' }
    if (outcome) matchStage.outcome = outcome
    if (followUp) {
        const date = new Date(followUp)
        if (!isNaN(date.getTime())) {
            const nextDay = new Date(date)
            nextDay.setDate(date.getDate() + 1)
            matchStage.followUp = {
                $gte: date,
                $lt: nextDay
            }
        }
    }

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },
        ...buildLeadEnrichmentPipeline(tenantId),
        {
            $addFields: {
                companyNameLower: { $toLower: { $ifNull: ['$lead.company.name', ''] } },
                contactNameLower: { $toLower: { $ifNull: ['$lead.contact.name', ''] } }
            }
        },
        {
            $facet: {
                data: [
                    {
                        $sort: {
                            [sort === 'company' ? 'companyNameLower' :
                                sort === 'contact' ? 'contactNameLower' :
                                    sort]: sortOrder
                        }
                    },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    {
                        $project: {
                            deleted: 0,
                            'lead.deleted': 0,
                            'lead.contact': 0,
                            companyNameLower: 0,
                            contactNameLower: 0
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ]

    const result = await CallLog.aggregate(pipeline)
    const formatted = formatPaginationResult(result, page, limit)

    return {
        callLogs: formatted.data,
        info: formatted.info
    }
}

/**
 * Get previous call log details for a lead
 * @param {string} tenantId
 * @param {string} leadId
 * @returns {Promise<object|null>}
 */
const getPreviousCallLogForLead = async (tenantId, leadId) => {
    const CallLog = callLogModel(tenantId)

    const pipeline = [
        {
            $match: {
                lead: new mongoose.Types.ObjectId(leadId),
                'deleted.isDeleted': false
            }
        },
        { $sort: { createdAt: -1 } },
        { $limit: 1 },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },
        ...buildLeadEnrichmentPipeline(tenantId),
        {
            $project: {
                deleted: 0,
                'lead.deleted': 0,
                'lead.contact': 0
            }
        }
    ]

    const result = await CallLog.aggregate(pipeline)
    return result[0] || null
}

/**
 * Get company call log activity details
 * @param {string} tenantId
 * @param {string} companyId
 * @returns {Promise<object[]>}
 */
const getCompanyCallLogActivity = async (tenantId, companyId) => {
    const CallLog = callLogModel(tenantId)

    const pipeline = [
        {
            $lookup: {
                from: `${tenantId}_leads`,
                let: { callLogLeadId: '$lead' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$_id', '$$callLogLeadId'] },
                                    { $eq: ['$company', new mongoose.Types.ObjectId(companyId)] },
                                    { $eq: ['$deleted.isDeleted', false] }
                                ]
                            }
                        }
                    }
                ],
                as: 'leadDetails'
            }
        },
        {
            $match: {
                'deleted.isDeleted': false,
                'leadDetails.0': { $exists: true }
            }
        },
        { $unwind: '$leadDetails' },
        ...contactLookupStage(tenantId, {
            localField: 'leadDetails.contact',
            as: 'contact',
            preserveNull: true
        }),
        {
            $addFields: {
                leadName: '$contact.name',
                leadEmail: '$contact.email',
                leadPhone: '$contact.phone'
            }
        },
        { $sort: { createdAt: -1 } },
        {
            $project: {
                deleted: 0,
                leadDetails: 0,
                contact: 0
            }
        }
    ]

    return await CallLog.aggregate(pipeline)
}

/**
 * Get call log reports with time period, lead, and createdBy filters
 * @param {string} tenantId
 * @param {object} filters
 * @returns {Promise<object>}
 */
// const getCallLogReports = async (tenantId, filters = {}) => {
//     const {
//         page = 1,
//         limit = 10,
//         period = 'day', // 'day', 'week', 'month'
//         date, // specific date for filtering
//         lead, // specific lead ID
//         createdBy, // user who created the call log
//         sort = 'createdAt',
//         order = 'desc'
//     } = filters

//     const CallLog = callLogModel(tenantId)

//     const matchStage = {
//         'deleted.isDeleted': false
//     }

//     // Time period filter
//     if (date) {
//         const filterDate = new Date(date)
//         let startDate, endDate

//         if (period === 'day') {
//             // Single day
//             startDate = new Date(filterDate)
//             startDate.setHours(0, 0, 0, 0)
//             endDate = new Date(filterDate)
//             endDate.setHours(23, 59, 59, 999)
//         } else if (period === 'week') {
//             // Week starting from the given date
//             startDate = new Date(filterDate)
//             startDate.setHours(0, 0, 0, 0)
//             // Get day of week (0 = Sunday, 1 = Monday, etc.)
//             const dayOfWeek = startDate.getDay()
//             // Move to Monday (start of week)
//             const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
//             startDate.setDate(startDate.getDate() + diff)

//             endDate = new Date(startDate)
//             endDate.setDate(endDate.getDate() + 6)
//             endDate.setHours(23, 59, 59, 999)
//         } else if (period === 'month') {
//             // Entire month
//             startDate = new Date(filterDate.getFullYear(), filterDate.getMonth(), 1)
//             startDate.setHours(0, 0, 0, 0)
//             endDate = new Date(filterDate.getFullYear(), filterDate.getMonth() + 1, 0)
//             endDate.setHours(23, 59, 59, 999)
//         }

//         matchStage.createdAt = {
//             $gte: startDate,
//             $lte: endDate
//         }
//     } else {
//         const now = new Date()
//         let startDate, endDate

//         if (period === 'day') {
//             startDate = new Date(now)
//             startDate.setHours(0, 0, 0, 0)

//             endDate = new Date(now)
//             endDate.setHours(23, 59, 59, 999)
//         }
//         else if (period === 'week') {
//             startDate = new Date(now)
//             startDate.setHours(0, 0, 0, 0)

//             const dayOfWeek = startDate.getDay()
//             const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
//             startDate.setDate(startDate.getDate() + diff)

//             endDate = new Date(startDate)
//             endDate.setDate(endDate.getDate() + 6)
//             endDate.setHours(23, 59, 59, 999)
//         }
//         else if (period === 'month') {
//             startDate = new Date(now.getFullYear(), now.getMonth(), 1)
//             startDate.setHours(0, 0, 0, 0)

//             endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
//             endDate.setHours(23, 59, 59, 999)
//         }

//         matchStage.callStartTime = {
//             $gte: startDate,
//             $lte: endDate
//         }
//     }


//     // Lead filter
//     if (lead) {
//         matchStage.lead = new mongoose.Types.ObjectId(lead)
//     }

//     // CreatedBy filter
//     if (createdBy) {
//         matchStage.createdBy = new mongoose.Types.ObjectId(createdBy)
//     }

//     const skip = (page - 1) * limit
//     const sortOrder = order === 'asc' ? 1 : -1

//     const pipeline = [
//         { $match: matchStage },
//         {
//             $lookup: {
//                 from: `${tenantId}_leads`,
//                 localField: 'lead',
//                 foreignField: '_id',
//                 as: 'lead'
//             }
//         },
//         { $unwind: '$lead' },
//         ...buildLeadEnrichmentPipeline(tenantId),
//         {
//             $lookup: {
//                 from: `${tenantId}_users`,
//                 let: { createdById: '$createdBy' },
//                 pipeline: [
//                     {
//                         $match: {
//                             $expr: {
//                                 $eq: ['$_id', '$$createdById']
//                             }
//                         }
//                     },
//                     {
//                         $project: {
//                             _id: 1,
//                             firstName: 1,
//                             lastName: 1,
//                             email: 1
//                         }
//                     }
//                 ],
//                 as: 'createdByUser'
//             }
//         },
//         {
//             $unwind: {
//                 path: '$createdByUser',
//                 preserveNullAndEmptyArrays: true
//             }
//         },
//         {
//             $addFields: {
//                 companyNameLower: { $toLower: { $ifNull: ['$lead.company.name', ''] } },
//                 contactNameLower: { $toLower: { $ifNull: ['$lead.contact.name', ''] } }
//             }
//         },
//         {
//             $facet: {
//                 data: [
//                     {
//                         $sort: {
//                             [sort === 'company' ? 'companyNameLower' :
//                                 sort === 'contact' ? 'contactNameLower' :
//                                     sort]: sortOrder
//                         }
//                     },
//                     { $skip: skip },
//                     { $limit: Number(limit) },
//                     {
//                         $project: {
//                             deleted: 0,
//                             'lead.deleted': 0,
//                             'lead.contact': 0,
//                             companyNameLower: 0,
//                             contactNameLower: 0
//                         }
//                     }
//                 ],
//                 totalCount: [
//                     { $count: 'count' }
//                 ],
//                 // Add summary statistics
//                 summary: [
//                     {
//                         $group: {
//                             _id: null,
//                             totalCalls: { $sum: 1 },
//                             outcomes: {
//                                 $push: '$outcome'
//                             }
//                         }
//                     },
//                     {
//                         $project: {
//                             _id: 0,
//                             totalCalls: 1,
//                             outcomeCounts: {
//                                 $arrayToObject: {
//                                     $map: {
//                                         input: {
//                                             $setUnion: '$outcomes'
//                                         },
//                                         as: 'outcome',
//                                         in: {
//                                             k: '$$outcome',
//                                             v: {
//                                                 $size: {
//                                                     $filter: {
//                                                         input: '$outcomes',
//                                                         cond: { $eq: ['$$this', '$$outcome'] }
//                                                     }
//                                                 }
//                                             }
//                                         }
//                                     }
//                                 }
//                             }
//                         }
//                     }
//                 ]
//             }
//         }
//     ]

//     const result = await CallLog.aggregate(pipeline)
//     const formatted = formatPaginationResult(result, page, limit)

//     return {
//         callLogs: formatted.data,
//         info: formatted.info,
//         summary: result[0]?.summary[0] || {
//             totalCalls: 0,
//             outcomeCounts: {}
//         }
//     }
// }

const getCallLogReports = async (tenantId, filters = {}) => {
    const {
        page = 1,
        limit = 10,
        period = 'day', // 'day', 'week', 'month'
        date, // specific date for filtering
        lead, // specific lead ID
        createdBy, // user who created the call log
        sort = 'createdAt',
        order = 'desc'
    } = filters

    const CallLog = callLogModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    // Time period filter - use UTC to avoid timezone issues
    let startDate, endDate
    const now = new Date()
    const filterDate = date ? new Date(date) : now

    if (period === 'day') {
        // Single day in UTC
        startDate = new Date(Date.UTC(
            filterDate.getUTCFullYear(),
            filterDate.getUTCMonth(),
            filterDate.getUTCDate(),
            0, 0, 0, 0
        ))
        endDate = new Date(Date.UTC(
            filterDate.getUTCFullYear(),
            filterDate.getUTCMonth(),
            filterDate.getUTCDate(),
            23, 59, 59, 999
        ))
    } else if (period === 'week') {
        // Week starting from the given date in UTC
        startDate = new Date(Date.UTC(
            filterDate.getUTCFullYear(),
            filterDate.getUTCMonth(),
            filterDate.getUTCDate(),
            0, 0, 0, 0
        ))
        // Get day of week (0 = Sunday, 1 = Monday, etc.)
        const dayOfWeek = startDate.getUTCDay()
        // Move to Monday (start of week)
        const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
        startDate.setUTCDate(startDate.getUTCDate() + diff)

        endDate = new Date(startDate)
        endDate.setUTCDate(endDate.getUTCDate() + 6)
        endDate.setUTCHours(23, 59, 59, 999)
    } else if (period === 'month') {
        // Entire month in UTC
        startDate = new Date(Date.UTC(
            filterDate.getUTCFullYear(),
            filterDate.getUTCMonth(),
            1,
            0, 0, 0, 0
        ))
        endDate = new Date(Date.UTC(
            filterDate.getUTCFullYear(),
            filterDate.getUTCMonth() + 1,
            0,
            23, 59, 59, 999
        ))
    }


    // Use callStartTime for filtering
    matchStage.callStartTime = {
        $gte: startDate,
        $lte: endDate
    }

    // Lead filter
    if (lead) {
        matchStage.lead = new mongoose.Types.ObjectId(lead)
    }

    // CreatedBy filter
    if (createdBy) {
        matchStage.createdBy = new mongoose.Types.ObjectId(createdBy)
    }

    console.log('Match Stage:', JSON.stringify(matchStage, null, 2)) // Debug log

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: `${tenantId}_leads`,
                localField: 'lead',
                foreignField: '_id',
                as: 'lead'
            }
        },
        { $unwind: '$lead' },
        ...buildLeadEnrichmentPipeline(tenantId),
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
                            _id: 1,
                            firstName: 1,
                            lastName: 1,
                            email: 1
                        }
                    }
                ],
                as: 'createdByUser'
            }
        },
        {
            $unwind: {
                path: '$createdByUser',
                preserveNullAndEmptyArrays: true
            }
        },
        {
            $addFields: {
                companyNameLower: { $toLower: { $ifNull: ['$lead.company.name', ''] } },
                contactNameLower: { $toLower: { $ifNull: ['$lead.contact.name', ''] } }
            }
        },
        {
            $facet: {
                data: [
                    {
                        $sort: {
                            [sort === 'company' ? 'companyNameLower' :
                                sort === 'contact' ? 'contactNameLower' :
                                    sort]: sortOrder
                        }
                    },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    {
                        $project: {
                            deleted: 0,
                            'lead.deleted': 0,
                            'lead.contact': 0,
                            companyNameLower: 0,
                            contactNameLower: 0
                        }
                    }
                ],
                totalCount: [
                    { $count: 'count' }
                ],
                // Add summary statistics
                summary: [
                    {
                        $group: {
                            _id: null,
                            totalCalls: { $sum: 1 },
                            outcomes: {
                                $push: '$outcome'
                            }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            totalCalls: 1,
                            outcomeCounts: {
                                $arrayToObject: {
                                    $map: {
                                        input: {
                                            $setUnion: '$outcomes'
                                        },
                                        as: 'outcome',
                                        in: {
                                            k: '$$outcome',
                                            v: {
                                                $size: {
                                                    $filter: {
                                                        input: '$outcomes',
                                                        cond: { $eq: ['$$this', '$$outcome'] }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                ]
            }
        }
    ]

    const result = await CallLog.aggregate(pipeline)
    const formatted = formatPaginationResult(result, page, limit)

    return {
        callLogs: formatted.data,
        info: formatted.info,
        summary: result[0]?.summary[0] || {
            totalCalls: 0,
            outcomeCounts: {}
        }
    }
}

module.exports = {
    getCallLogByIdWithDetails,
    getAllCallLogsWithPagination,
    getPreviousCallLogForLead,
    getCompanyCallLogActivity,
    getCallLogReports,
    buildLeadEnrichmentPipeline
}
