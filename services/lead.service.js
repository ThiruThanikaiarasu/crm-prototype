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

        const { company, contacts, status, source, followUp } = payload

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

        const [companyLead] = await CompanyLead.create(
            [company],
            { session }
        )

        const contactsPayload = Array.isArray(contacts) ? contacts : []

        if (contactsPayload.length > 0) {
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
        }

        let sanitizedLeads = []

        if (contactsPayload.length > 0) {
            const contactLeads = await ContactLead.insertMany(
                contacts,
                { session }
            )

            const leads = contactLeads.map(contactLead => ({
                company: companyLead._id,
                contact: contactLead._id,
                status,
                source,
                followUp,
                userId
            }))

            const insertedLeads = await Lead.insertMany(
                leads,
                { session }
            )

            const contactMap = new Map(
                contactLeads.map(c => [c._id.toString(), c])
            )

            const companyObj = companyLead.toObject()
            delete companyObj.deleted

            sanitizedLeads = insertedLeads.map(lead => {
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
        } else {
            const [insertedLead] = await Lead.create(
                [{
                    company: companyLead._id,
                    status,
                    source,
                    followUp,
                    userId
                }],
                { session }
            )

            const companyObj = companyLead.toObject()
            delete companyObj.deleted

            sanitizedLeads = [{
                _id: insertedLead._id,
                company: companyObj,
                contact: null,
                status: insertedLead.status,
                source: insertedLead.source,
                followUp: insertedLead.followUp,
                userId: insertedLead.userId,
                createdAt: insertedLead.createdAt,
                updatedAt: insertedLead.updatedAt
            }]
        }

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
        company,
        contact,
        status,
        source,
        sort = 'createdAt',
        order = 'desc',
        followUp,
    } = {}
) => {
    const Lead = leadModel(tenantId)
    const query = {}

    if (company) {
        query.company = { $regex: company, $options: 'i' }
    }

    if (contact) {
        query.contact = { $regex: contact, $options: 'i' }
    }
    if (status) {
        query.status = status
    }
    if (source) {
        query.source = { $regex: source, $options: 'i' }
    }
    if (followUp) {
        const date = new Date(followUp)
        if (!isNaN(date.getTime())) {
            // Match the entire day
            const nextDay = new Date(date)
            nextDay.setDate(date.getDate() + 1)
            query.followUp = {
                $gte: date,
                $lt: nextDay
            }
        }
    }

    const skip = (page - 1) * limit
    const sortOrder = order === 'asc' ? 1 : -1
    const sortOptions = { [sort]: sortOrder }

    const [leads, total] = await Promise.all([
        Lead.find(query)
            // .notDeleted()
            .sort(sortOptions)
            .skip(skip)
            .limit(Number(limit)),

        Lead.countDocuments({
            ...query,
            'deleted.isDeleted': false,
        }),
    ])


    const totalPages = Math.ceil(total / limit)

    return {
        leads,
        info: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages,
            hasMoreRecords: page < totalPages,
        },
    }
}

const getLeadById = async (tenantId, id) => {
    const Lead = leadModel(tenantId)
    return await Lead.findById(id)
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
