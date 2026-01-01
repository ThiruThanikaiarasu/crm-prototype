const mongoose = require('mongoose')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
const leadModel = require('../models/lead.model')
const ConflictError = require('../errors/ConflictError')
const NotFoundError = require('../errors/NotFoundError')
const { ERROR_CODES } = require('../constants/error.constant')

const createLead = async (payload, tenantId, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const { company, leads } = payload

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

        const leadsPayload = Array.isArray(leads) ? leads : []

        let response = {
            company: null,
            leads: []
        }

        if (leadsPayload.length > 0) {
            for (const leadData of leadsPayload) {
                const contactQuery = {
                    'deleted.isDeleted': false,
                    $or: []
                }

                if (leadData?.email) {
                    contactQuery.$or.push({
                        email: {
                            $regex: `^${escapeRegex(leadData.email)}$`,
                            $options: 'i'
                        }
                    })
                }

                if (leadData?.phone?.number) {
                    contactQuery.$or.push({
                        'phone.number': leadData.phone.number
                    })
                }

                if (contactQuery.$or.length > 0) {
                    const existingContact = await ContactLead.findOne(contactQuery)
                    if (existingContact) {
                        throw new ConflictError(
                            409,
                            'Lead already exists',
                            ERROR_CODES.LEAD_ALREADY_EXISTS,
                            'conflict'
                        )
                    }
                }
            }

            const contactsToInsert = leadsPayload.map(leadData => {
                const { status, source, followUp, priority, ...contactInfo } = leadData
                return contactInfo
            })

            const contactLeads = await ContactLead.insertMany(
                contactsToInsert,
                { session }
            )

            const leadsToInsert = contactLeads.map((contactLead, index) => {
                const originalLead = leadsPayload[index]
                return {
                    company: companyLead._id,
                    contact: contactLead._id,
                    status: originalLead.status || null,
                    source: originalLead.source || null,
                    status: originalLead.status || null,
                    source: originalLead.source || null,
                    followUp: originalLead.followUp || null,
                    priority: originalLead.priority || 1,
                    userId
                }
            })

            const insertedLeads = await Lead.create(
                leadsToInsert,
                { session, ordered: true }
            )

            const companyObj = companyLead.toObject()
            delete companyObj.deleted

            const formattedLeads = insertedLeads.map((lead, index) => {
                const contactInfo = contactLeads[index].toObject()
                return {
                    _id: lead._id,
                    company: companyLead._id,
                    name: contactInfo.name,
                    email: contactInfo.email,
                    phone: contactInfo.phone,
                    status: lead.status,
                    source: lead.source,
                    followUp: lead.followUp,
                    priority: lead.priority,
                    createdAt: lead.createdAt,
                    updatedAt: lead.updatedAt
                }
            })

            response = {
                company: companyObj,
                leads: formattedLeads
            }

        } else {
            const [insertedLead] = await Lead.create(
                [{
                    company: companyLead._id,
                    contact: null,
                    status: 'new',
                    source: null,
                    followUp: null,
                    priority: 1,
                    userId
                }],
                { session }
            )

            const companyObj = companyLead.toObject()
            delete companyObj.deleted

            response = {
                company: companyObj,
                leads: [{
                    _id: insertedLead._id,
                    company: companyLead._id,
                    name: null,
                    email: null,
                    phone: null,
                    status: insertedLead.status,
                    source: insertedLead.source,
                    followUp: insertedLead.followUp,
                    priority: insertedLead.priority,
                    createdAt: insertedLead.createdAt,
                    updatedAt: insertedLead.updatedAt
                }]
            }
        }

        await session.commitTransaction()
        return response
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
        priority,
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
        matchConditions.source = {
            $regex: new RegExp(source, 'i'),
            $ne: null
        }
    }

    if (followUp) {
        const startOfDay = new Date(followUp)
        startOfDay.setHours(0, 0, 0, 0)

        const endOfDay = new Date(followUp)
        endOfDay.setHours(23, 59, 59, 999)

        matchConditions.followUp = {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }

    if (priority) {
        matchConditions.priority = Number(priority)
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
                    }
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

    pipeline.push({
        $group: {
            _id: '$company._id',
            companyDetails: { $first: '$company' },
            matchedLeadsCount: { $sum: 1 },
            maxCreatedAt: { $max: '$createdAt' }
        }
    })

    const allowedSortFields = ['createdAt', 'matchedLeadsCount']
    const sortField = sort === 'createdAt' ? 'maxCreatedAt' : 'matchedLeadsCount' // Simplified sort strategy
    const sortOrder = order === 'asc' ? 1 : -1
    const sortObject = { [sortField]: sortOrder }

    pipeline.push({
        $facet: {
            data: [
                { $sort: sortObject },
                { $skip: skip },
                { $limit: Number(limit) },
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
                                            { $eq: ['$deleted.isDeleted', false] }
                                        ]
                                    }
                                }
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
                            {
                                $addFields: {
                                    name: '$contact.name',
                                    email: '$contact.email',
                                    phone: '$contact.phone'
                                }
                            },
                            { $sort: { createdAt: -1 } },
                            {
                                $project: {
                                    deleted: 0,
                                    contact: 0
                                }
                            }
                        ],
                        as: 'leads'
                    }
                },
                {
                    $project: {
                        _id: 0,
                        company: {
                            $mergeObjects: ['$companyDetails', { deleted: '$$REMOVE' }]
                        },
                        leads: 1
                    }
                }
            ],
            totalCount: [
                { $count: 'count' }
            ]
        }
    })

    const result = await Lead.aggregate(pipeline)

    const companies = result[0].data
    const total = result[0].totalCount[0]?.count || 0
    const totalPages = Math.ceil(total / limit)

    return {
        leads: companies,
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
                from: `${tenantId}_leads`,
                let: { companyId: '$company._id', currentLeadId: '$_id' },
                pipeline: [
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$company', '$$companyId'] },
                                    { $eq: ['$deleted.isDeleted', false] },
                                    { $ne: ['$_id', '$$currentLeadId'] }
                                ]
                            }
                        }
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
                    {
                        $addFields: {
                            name: '$contact.name',
                            email: '$contact.email',
                            phone: '$contact.phone'
                        }
                    },
                    {
                        $project: {
                            deleted: 0,
                            contact: 0
                        }
                    },
                    { $sort: { createdAt: -1 } }
                ],
                as: 'company.leads'
            }
        },
        {
            $addFields: {
                'company.leads': {
                    $cond: {
                        if: { $eq: [{ $size: '$company.leads' }, 0] },
                        then: null,
                        else: '$company.leads'
                    }
                }
            }
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
            $addFields: {
                name: '$contact.name',
                email: '$contact.email',
                phone: '$contact.phone'
            }
        },
        {
            $project: {
                deleted: 0,
                contact: 0
            }
        }
    ]

    const result = await Lead.aggregate(pipeline)

    return result.length > 0 ? result[0] : null
}

const updateLeadById = async (tenantId, id, payload) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Lead = leadModel(tenantId)
        const CompanyLead = companyLeadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)

        const lead = await Lead.findById(id).session(session)

        if (!lead) {
            throw new NotFoundError(
                404,
                'Lead not found',
                ERROR_CODES.LEAD_NOT_FOUND,
                'not_found'
            )
        }

        const { company, leads, name, email, phone, status, source, followUp, priority } = payload

        if (company && Object.keys(company).length > 0) {
            const companyUpdateData = {}

            Object.keys(company).forEach(key => {
                if (company[key] === undefined) return

                if (key === 'phone' && typeof company.phone === 'object') {
                    Object.keys(company.phone).forEach(phoneKey => {
                        if (company.phone[phoneKey] !== undefined) {
                            companyUpdateData[`phone.${phoneKey}`] = company.phone[phoneKey]
                        }
                    })
                    return
                }

                companyUpdateData[key] = company[key]
            })

            if (Object.keys(companyUpdateData).length > 0) {
                await CompanyLead.findByIdAndUpdate(
                    lead.company,
                    { $set: companyUpdateData },
                    { session, new: true }
                )
            }
        }

        const contactUpdateData = {}
        if (name !== undefined) contactUpdateData.name = name
        if (email !== undefined) contactUpdateData.email = email

        if (phone && typeof phone === 'object') {
            Object.keys(phone).forEach(phoneKey => {
                if (phone[phoneKey] !== undefined) {
                    contactUpdateData[`phone.${phoneKey}`] = phone[phoneKey]
                }
            })
        }

        if (Object.keys(contactUpdateData).length > 0) {
            if (lead.contact) {
                // Update existing contact
                await ContactLead.findByIdAndUpdate(
                    lead.contact,
                    { $set: contactUpdateData },
                    { session, new: true }
                )
            } else {
                // Create NEW contact if lead doesn't have one
                const [newContact] = await ContactLead.create(
                    [{
                        ...contactUpdateData,
                        // Ensure required fields are present or handle specifically if needed (validation handles this usually)
                    }],
                    { session }
                )
                
                // Link new contact to the lead
                lead.contact = newContact._id
            }
        }

        // Handle creation of new leads (contacts) if provided
        if (leads && Array.isArray(leads) && leads.length > 0) {
            const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            const leadsToProcess = []
            
            // 1. Check for duplicates and filter them out
            for (const leadData of leads) {
                const contactQuery = {
                    'deleted.isDeleted': false,
                    $or: []
                }

                if (leadData?.email && typeof leadData.email === 'string' && leadData.email.trim().length > 0) {
                    contactQuery.$or.push({
                        email: {
                            $regex: `^${escapeRegex(leadData.email)}$`,
                            $options: 'i'
                        }
                    })
                }

                if (leadData?.phone?.number && typeof leadData.phone.number === 'string' && leadData.phone.number.trim().length > 0) {
                    contactQuery.$or.push({
                        'phone.number': leadData.phone.number
                    })
                }

                let exists = false
                if (contactQuery.$or.length > 0) {
                    const existingContact = await ContactLead.findOne(contactQuery).session(session)
                    if (existingContact) {
                        exists = true
                        // Log or ignore? ignoring as per "Intelligent Edit"
                    }
                }
                
                if (!exists) {
                    leadsToProcess.push(leadData)
                }
            }

            if (leadsToProcess.length > 0) {
                // 2. Prepare contacts for insertion
                const contactsToInsert = leadsToProcess.map(leadData => {
                    const { status, source, followUp, priority, ...contactInfo } = leadData
                    return contactInfo
                })

                // 3. Insert new contacts
                const insertedContacts = await ContactLead.insertMany(
                    contactsToInsert,
                    { session }
                )

                // 4. Prepare leads for insertion (linking to EXISTING company)
                const leadsToInsert = insertedContacts.map((contactLead, index) => {
                    const originalLead = leadsToProcess[index]
                    return {
                        company: lead.company, // Use existing company ID
                        contact: contactLead._id,
                        status: originalLead.status || 'new',
                        source: originalLead.source || null,
                        followUp: originalLead.followUp || null,
                        priority: originalLead.priority || 1,
                        owner: lead.owner // Proactively assigning existing lead's owner
                    }
                })

                // 5. Insert new leads
                await Lead.create(
                    leadsToInsert,
                    { session }
                )
            }
        }

        if (status !== undefined) lead.status = status
        if (source !== undefined) lead.source = source
        if (followUp !== undefined) lead.followUp = followUp
        if (priority !== undefined) lead.priority = priority

        await lead.save({ session })

        await session.commitTransaction()

        return await getLeadById(tenantId, id)

    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

const deleteLeadById = async (tenantId, userId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Lead = leadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)

        const lead = await Lead.findOne({
            _id: id,
            'deleted.isDeleted': false
        }).session(session)

        if (!lead) {
            throw new NotFoundError(
                404,
                'Lead not found',
                ERROR_CODES.LEAD_NOT_FOUND,
                'not_found'
            )
        }

        lead.deleted = {
            isDeleted: true,
            deletedAt: new Date(),
            deletedBy: userId
        }
        await lead.save({ session })

        if (lead.contact) {
            await ContactLead.findByIdAndUpdate(
                lead.contact,
                {
                    $set: {
                        'deleted.isDeleted': true,
                        'deleted.deletedAt': new Date(),
                        'deleted.deletedBy': userId
                    }
                },
                { session }
            )
        }

        await session.commitTransaction()
        return true
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

module.exports = {
    createLead,
    getAllLeads,
    getLeadById,
    updateLeadById,
    deleteLeadById,
}
