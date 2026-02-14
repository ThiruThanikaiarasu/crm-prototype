const mongoose = require('mongoose')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
const leadModel = require('../models/lead.model')
const userModel = require('../models/user.model')
const ConflictError = require('../errors/ConflictError')
const NotFoundError = require('../errors/NotFoundError')
const { ERROR_CODES } = require('../constants/error.constant')

// Import repository functions for DB operations
const {
    getLeadByIdWithDetails,
    getAllLeadsWithPagination
} = require('../repositories/lead.repository')

const createLead = async (payload, tenantId, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const { company, leads } = payload

        const CompanyLead = companyLeadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)
        const Lead = leadModel(tenantId)
        const User = userModel(tenantId)

        const user = await User.findById(userId).select('firstName lastName email')

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
                const { status, source, followUp, priority, droppedReason, benificiary, ...contactInfo } = leadData
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
                    droppedReason: originalLead.droppedReason || null,
                    source: originalLead.source || null,
                    followUp: originalLead.followUp || null,
                    priority: originalLead.priority || 1,
                    benificiary: originalLead.benificiary || undefined,
                    createdBy: userId
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
                    department: contactInfo.department,
                    remarks: contactInfo.remarks,
                    status: lead.status,
                    source: lead.source,
                    followUp: lead.followUp,
                    priority: lead.priority,
                    benificiary: lead.benificiary,
                    createdAt: lead.createdAt,
                    updatedAt: lead.updatedAt,
                    createdBy: user
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
                    createdBy: userId
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
                    createdAt: insertedLead.createdAt,
                    updatedAt: insertedLead.updatedAt,
                    createdBy: user
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
        serviceType,
        owner
    } = {},
    userRole = null
) => {
    // Use repository function for complex aggregation
    return await getAllLeadsWithPagination(tenantId, {
        page,
        limit,
        contact,
        company,
        status,
        source,
        sort,
        order,
        followUp,
        priority,
        serviceType,
        owner
    }, userRole)
}

const getLeadById = async (tenantId, id, userRole = null) => {
    // Use repository function for complex aggregation
    return await getLeadByIdWithDetails(tenantId, id, userRole)
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

        const { company, leads, name, email, phone, department, remarks, status, source, followUp, priority, droppedReason, benificiary } = payload

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

                if (key === 'address' && typeof company.address === 'object') {
                    Object.keys(company.address).forEach(addressKey => {
                        if (company.address[addressKey] === undefined) return

                        if (addressKey === 'location' && typeof company.address.location === 'object') {
                            Object.keys(company.address.location).forEach(locationKey => {
                                if (company.address.location[locationKey] !== undefined) {
                                    companyUpdateData[`address.location.${locationKey}`] = company.address.location[locationKey]
                                }
                            })
                        } else {
                            companyUpdateData[`address.${addressKey}`] = company.address[addressKey]
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
        if (department !== undefined) contactUpdateData.department = department
        if (remarks !== undefined) contactUpdateData.remarks = remarks

        if (phone && typeof phone === 'object') {
            Object.keys(phone).forEach(phoneKey => {
                if (phone[phoneKey] !== undefined) {
                    contactUpdateData[`phone.${phoneKey}`] = phone[phoneKey]
                }
            })
        }

        if (Object.keys(contactUpdateData).length > 0) {
            if (lead.contact) {
                await ContactLead.findByIdAndUpdate(
                    lead.contact,
                    { $set: contactUpdateData },
                    { session, new: true }
                )
            } else {
                const [newContact] = await ContactLead.create(
                    [{
                        ...contactUpdateData,
                    }],
                    { session }
                )

                lead.contact = newContact._id
            }
        }

        if (leads && Array.isArray(leads) && leads.length > 0) {
            const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

            const leadsToProcess = []
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
                    }
                }

                if (!exists) {
                    leadsToProcess.push(leadData)
                }
            }

            if (leadsToProcess.length > 0) {
                const contactsToInsert = leadsToProcess.map(leadData => {
                    const { status, source, followUp, priority, droppedReason, benificiary, ...contactInfo } = leadData
                    return contactInfo
                })
                const insertedContacts = await ContactLead.insertMany(
                    contactsToInsert,
                    { session }
                )

                const leadsToInsert = insertedContacts.map((contactLead, index) => {
                    const originalLead = leadsToProcess[index]
                    return {
                        company: lead.company,
                        contact: contactLead._id,
                        status: originalLead.status || 'new',
                        droppedReason: originalLead.droppedReason ?? undefined,
                        source: originalLead.source || null,
                        followUp: originalLead.followUp || null,
                        priority: originalLead.priority || 1,
                        benificiary: originalLead.benificiary || undefined,
                        createdBy: lead.owner
                    }
                })

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
        if (benificiary !== undefined) {
            if (benificiary && typeof benificiary === 'object') {
                Object.keys(benificiary).forEach(key => {
                    if (benificiary[key] === undefined) return

                    if (key === 'phone' && typeof benificiary.phone === 'object') {
                        Object.keys(benificiary.phone).forEach(phoneKey => {
                            if (benificiary.phone[phoneKey] !== undefined) {
                                if (!lead.benificiary) lead.benificiary = {}
                                if (!lead.benificiary.phone) lead.benificiary.phone = {}
                                lead.benificiary.phone[phoneKey] = benificiary.phone[phoneKey]
                            }
                        })
                    } else {
                        if (!lead.benificiary) lead.benificiary = {}
                        lead.benificiary[key] = benificiary[key]
                    }
                })
            } else {
                lead.benificiary = benificiary
            }
        }
        if (status !== undefined) {
            lead.status = status
            if (status === 'dropped') {
                lead.droppedReason = droppedReason ?? lead.droppedReason
            } else {
                lead.droppedReason = undefined
            }
        }


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
            at: new Date(),
            by: userId
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

const restoreLeadById = async (tenantId, userId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Lead = leadModel(tenantId)
        const ContactLead = contactLeadModel(tenantId)

        const result = await Lead.updateOne(
            {
                _id: id,
                'deleted.isDeleted': true,
            },
            {
                $set: {
                    'deleted.isDeleted': false,
                    'deleted.restoredAt': new Date(),
                    'deleted.restoredBy': userId,
                },
            },
            { session }
        )

        if (result.matchedCount === 0) {
            throw new NotFoundError(
                404,
                'Lead not found or not deleted',
                ERROR_CODES.LEAD_NOT_FOUND,
                'not_found'
            )
        }

        const lead = await Lead.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } }
        ]).session(session)

        if (lead[0]?.contact) {
            await ContactLead.updateOne(
                { _id: lead[0].contact },
                {
                    $set: {
                        'deleted.isDeleted': false,
                        'deleted.restoredAt': new Date(),
                        'deleted.restoredBy': userId,
                    },
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

const getPreviousCallLogDetails = async (tenantId, id) => {
    const Lead = leadModel(tenantId)

    return lead[0]
}

module.exports = {
    createLead,
    getAllLeads,
    getLeadById,
    updateLeadById,
    deleteLeadById,
    restoreLeadById
}
