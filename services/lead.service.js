const mongoose = require('mongoose')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
const leadModel = require('../models/lead.model')
const ConflictError = require('../errors/ConflictError')
const { ERROR_CODES } = require('../constants/error.constant')

const createLead = async (payload, tenantId, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const { company, contacts } = payload

        const CompanyLead = companyLeadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)
        const Lead = leadModel(tenantId)

        const escapeRegex = value =>
            value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

        const companyQuery = {
            'deleted.isDeleted': false,
            $or: []
        }

        if (company?.name) {
            companyQuery.$or.push({
                name: {
                    $regex: `^${escapeRegex(company.name)}$`,
                    $options: 'i'
                }
            })
        }

        if (company?.phone?.number) {
            companyQuery.$or.push({
                'phone.number': company.phone.number
            })
        }

        if (companyQuery.$or.length > 0) {
            const existingCompany = await CompanyLead.findOne(companyQuery)
            if (existingCompany) {
                throw new ConflictError(
                    409,
                    'Company already exists',
                    ERROR_CODES.COMPANY_ALREADY_EXISTS,
                    'conflict'
                )
            }
        }

        // Create company
        const [companyLead] = await CompanyLead.create(
            [company],
            { session }
        )

        const contactsPayload = Array.isArray(contacts) ? contacts : []

        if (contactsPayload.length === 0) {
            throw new Error('At least one contact is required')
        }

        // Check for duplicate contacts
        for (const contact of contactsPayload) {
            const contactQuery = {
                'deleted.isDeleted': false,
                $or: []
            }

            if (contact?.email) {
                contactQuery.$or.push({
                    email: {
                        $regex: `^${escapeRegex(contact.email)}$`,
                        $options: 'i'
                    }
                })
            }

            if (contact?.phone?.number) {
                contactQuery.$or.push({
                    'phone.number': contact.phone.number
                })
            }

            if (contactQuery.$or.length > 0) {
                const existingContact = await ContactLead.findOne(contactQuery)
                if (existingContact) {
                    throw new ConflictError(
                        409,
                        'Contact already exists',
                        ERROR_CODES.CONTACT_ALREADY_EXISTS,
                        'conflict'
                    )
                }
            }
        }

        // Separate contact data from lead-specific fields
        const contactsToInsert = contactsPayload.map(contact => {
            const { status, source, followUp, ...contactData } = contact
            return contactData
        })

        // Create contacts
        const contactLeads = await ContactLead.insertMany(
            contactsToInsert,
            { session }
        )

        // Create leads with contact-specific status, source, followUp
        const leads = contactLeads.map((contactLead, index) => {
            const originalContact = contactsPayload[index]
            return {
                company: companyLead._id,
                contact: contactLead._id,
                status: originalContact.status,
                source: originalContact.source,
                followUp: originalContact.followUp,
                userId
            }
        })

        const insertedLeads = await Lead.insertMany(
            leads,
            { session }
        )

        // Prepare sanitized response
        const contactMap = new Map(
            contactLeads.map(c => [c._id.toString(), c])
        )

        const companyObj = companyLead.toObject()
        delete companyObj.deleted

        const sanitizedLeads = insertedLeads.map(lead => {
            const contactObj = contactMap
                .get(lead.contact.toString())
                ?.toObject()

            delete contactObj?.deleted

            return {
                _id: lead._id,
                company: companyObj,
                contact: contactObj,
                status: lead.status,
                source: lead.source,
                followUp: lead.followUp,
                userId: lead.userId,
                createdAt: lead.createdAt,
                updatedAt: lead.updatedAt
            }
        })

        await session.commitTransaction()
        return sanitizedLeads
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

const getAllLeads = async (
    tenantId,
    {
        page = 1,
        limit = 10,
        contact,
        company,
        status,
        source,
        sort = 'createdAt',
        order = 'desc',
        followUp,
    } = {}
) => {
    const Lead = leadModel(tenantId)

    const skip = (page - 1) * limit

    const matchConditions = {
        'deleted.isDeleted': false
    }

    if (status) {
        matchConditions.status = status
    }

    if (source) {
        matchConditions.source = { $regex: source, $options: 'i' }
    }

    if (followUp) {
        const followUpDate = new Date(followUp)
        matchConditions.followUp = {
            $gte: new Date(followUpDate.setHours(0, 0, 0, 0)),
            $lte: new Date(followUpDate.setHours(23, 59, 59, 999))
        }
    }

    const pipeline = [
        {
            $match: matchConditions
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

    const postLookupMatch = {}

    if (company) {
        postLookupMatch['company.name'] = { $regex: company, $options: 'i' }
    }

    if (contact) {
        postLookupMatch['contact.name'] = { $regex: contact, $options: 'i' }
    }

    if (Object.keys(postLookupMatch).length > 0) {
        pipeline.push({
            $match: postLookupMatch
        })
    }

    const sortOrder = order === 'asc' ? 1 : -1
    const sortField = sort || 'createdAt'
    const sortObject = { [sortField]: sortOrder }

    pipeline.push({
        $facet: {
            data: [
                { $sort: sortObject },
                { $skip: skip },
                { $limit: Number(limit) }
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    })

    const result = await Lead.aggregate(pipeline)

    const leads = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        leads,
        info: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasMoreRecords: page < totalPages
        }
    }
}

const getLeadById = async (tenantId, id) => {
    const Lead = leadModel(tenantId)

    const pipeline = [
        {
            $match: {
                _id: new mongoose.Types.ObjectId(id),
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
        },
        {
            $project: {
                deleted: 0
            }
        }
    ]

    const result = await Lead.aggregate(pipeline)

    return result.length > 0 ? result[0] : null
}

const updateLeadById = async (tenantId, id, payload) => {
    const Lead = leadModel(tenantId)
    const lead = await Lead.findById(id)

    if (!lead) {
        throw new NotFoundError(404, 'Lead not found', ERROR_CODES.LEAD_NOT_FOUND, 'not_found')
    }

    Object.keys(payload).forEach(key => {
        if (payload[key] === undefined) return

        // handle nested phone separately
        if (key === 'phone' && typeof payload.phone === 'object') {
            Object.keys(payload.phone).forEach(phoneKey => {
                if (payload.phone[phoneKey] !== undefined) {
                    lead.phone[phoneKey] = payload.phone[phoneKey]
                }
            })
            return
        }

        lead[key] = payload[key]
    })
    return await lead.save()
}

const deleteLeadById = async (tenantId, userId, id) => {
    const Lead = leadModel(tenantId)
    const lead = await Lead.findById(id)

if (!lead) {
        throw new NotFoundError(404, 'Lead not found', ERROR_CODES.LEAD_NOT_FOUND, 'not_found')
    }

    lead.deleted.isDeleted = true
    lead.deleted.at = new Date()
    lead.deleted.by = userId

    await lead.save()
    return lead
}

module.exports = {
    createLead,
    getAllLeads,
    getLeadById,
    updateLeadById,
    deleteLeadById,
}
