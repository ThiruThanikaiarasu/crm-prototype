const mongoose = require('mongoose')
const companyProspectusModel = require('../models/companyProspectus.model')
const contactProspectusModel = require('../models/contactProspectus.model')
const prospectusModel = require('../models/prospectus.model')
const companyLeadModel = require('../models/companyLead.model')
const contactLeadModel = require('../models/contactLead.model')
const leadModel = require('../models/lead.model')
const userModel = require('../models/user.model')
const ConflictError = require('../errors/ConflictError')
const NotFoundError = require('../errors/NotFoundError')
const BadRequestError = require('../errors/BadRequestError')
const { ERROR_CODES } = require('../constants/error.constant')
const { getProspectusById, getAllProspectusWithPagination } = require('../repositories/prospectus.repository')

const escapeRegex = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const _createSingleProspectus = async (payload, tenantId, userId, session) => {
    const { company, leads } = payload

    const CompanyProspectus = companyProspectusModel(tenantId)
    const ContactProspectus = contactProspectusModel(tenantId)
    const Prospectus = prospectusModel(tenantId)
    const User = userModel(tenantId)

    const user = await User.findById(userId).select('firstName lastName email')

    const companyQuery = { 'deleted.isDeleted': false, $or: [] }

    if (company?.name) {
        companyQuery.$or.push({
            name: { $regex: `^${escapeRegex(company.name)}$`, $options: 'i' }
        })
    }

    if (company?.phone?.number) {
        companyQuery.$or.push({ 'phone.number': company.phone.number })
    }

    if (companyQuery.$or.length > 0) {
        const existingCompany = await CompanyProspectus.findOne(companyQuery)
        if (existingCompany) {
            throw new ConflictError(
                409,
                'Prospectus company already exists',
                ERROR_CODES.PROSPECTUS_COMPANY_ALREADY_EXISTS,
                'conflict'
            )
        }
    }

    const [companyProspectus] = await CompanyProspectus.create([company], { session })

    const leadsPayload = Array.isArray(leads) ? leads : []
    let response = { company: null, prospectuses: [] }

    if (leadsPayload.length > 0) {
        for (const leadData of leadsPayload) {
            const contactQuery = { 'deleted.isDeleted': false, $or: [] }

            if (leadData?.email) {
                contactQuery.$or.push({
                    email: { $regex: `^${escapeRegex(leadData.email)}$`, $options: 'i' }
                })
            }

            if (leadData?.phone?.number) {
                contactQuery.$or.push({ 'phone.number': leadData.phone.number })
            }

            if (contactQuery.$or.length > 0) {
                const existingContact = await ContactProspectus.findOne(contactQuery)
                if (existingContact) {
                    throw new ConflictError(
                        409,
                        'Prospectus contact already exists',
                        ERROR_CODES.PROSPECTUS_ALREADY_EXISTS,
                        'conflict'
                    )
                }
            }
        }

        const contactsToInsert = leadsPayload.map(leadData => {
            const { status, source, followUp, priority, benificiary, ...contactInfo } = leadData
            return contactInfo
        })

        const contactProspectuses = await ContactProspectus.insertMany(contactsToInsert, { session })

        const prospectusesToInsert = contactProspectuses.map((contactProspectus, index) => {
            const originalLead = leadsPayload[index]
            return {
                company: companyProspectus._id,
                contact: contactProspectus._id,
                status: originalLead.status || 'new',
                source: originalLead.source || null,
                followUp: originalLead.followUp || null,
                priority: originalLead.priority || 0,
                benificiary: originalLead.benificiary || undefined,
                createdBy: userId
            }
        })

        const insertedProspectuses = await Prospectus.create(prospectusesToInsert, { session, ordered: true })

        const companyObj = companyProspectus.toObject()
        delete companyObj.deleted

        const formattedProspectuses = insertedProspectuses.map((prospectus, index) => {
            const contactInfo = contactProspectuses[index].toObject()
            return {
                _id: prospectus._id,
                company: companyProspectus._id,
                name: contactInfo.name,
                email: contactInfo.email,
                phone: contactInfo.phone,
                department: contactInfo.department,
                remarks: contactInfo.remarks,
                status: prospectus.status,
                source: prospectus.source,
                followUp: prospectus.followUp,
                priority: prospectus.priority,
                benificiary: prospectus.benificiary,
                convertedToLead: prospectus.convertedToLead,
                createdAt: prospectus.createdAt,
                updatedAt: prospectus.updatedAt,
                createdBy: user
            }
        })

        response = { company: companyObj, prospectuses: formattedProspectuses }
    } else {
        const [insertedProspectus] = await Prospectus.create(
            [{
                company: companyProspectus._id,
                contact: null,
                status: 'new',
                source: null,
                followUp: null,
                priority: 0,
                createdBy: userId
            }],
            { session }
        )

        const companyObj = companyProspectus.toObject()
        delete companyObj.deleted

        response = {
            company: companyObj,
            prospectuses: [{
                _id: insertedProspectus._id,
                company: companyProspectus._id,
                name: null,
                email: null,
                phone: null,
                status: insertedProspectus.status,
                source: insertedProspectus.source,
                followUp: insertedProspectus.followUp,
                priority: insertedProspectus.priority,
                convertedToLead: insertedProspectus.convertedToLead,
                createdAt: insertedProspectus.createdAt,
                updatedAt: insertedProspectus.updatedAt,
                createdBy: user
            }]
        }
    }

    return response
}

const createProspectus = async (payload, tenantId, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()
        const result = await _createSingleProspectus(payload, tenantId, userId, session)
        await session.commitTransaction()
        return result
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

const bulkCreateProspectus = async (payloads, tenantId, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const results = []
        for (const payload of payloads) {
            const result = await _createSingleProspectus(payload, tenantId, userId, session)
            results.push(result)
        }

        await session.commitTransaction()
        return results
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

const getAllProspectus = async (tenantId, filters = {}, userRole = null) => {
    return await getAllProspectusWithPagination(tenantId, filters, userRole)
}

const getAProspectusById = async (tenantId, id, userRole = null) => {
    return await getProspectusById(tenantId, id, userRole)
}

const _convertProspectusToLead = async (tenantId, prospectus, userId, session) => {
    const CompanyProspectus = companyProspectusModel(tenantId)
    const ContactProspectus = contactProspectusModel(tenantId)
    const CompanyLead = companyLeadModel(tenantId)
    const ContactLead = contactLeadModel(tenantId)
    const Lead = leadModel(tenantId)

    // Load the company prospectus data
    const companyProspectusData = await CompanyProspectus.findById(prospectus.company).session(session)
    if (!companyProspectusData) {
        throw new NotFoundError(404, 'Company prospectus not found', ERROR_CODES.PROSPECTUS_NOT_FOUND, 'not_found')
    }

    // Check if company already exists in leads (by name or phone)
    const companyQuery = { 'deleted.isDeleted': false, $or: [] }
    if (companyProspectusData.name) {
        companyQuery.$or.push({
            name: { $regex: `^${escapeRegex(companyProspectusData.name)}$`, $options: 'i' }
        })
    }
    if (companyProspectusData.phone?.number) {
        companyQuery.$or.push({ 'phone.number': companyProspectusData.phone.number })
    }

    let companyLead
    if (companyQuery.$or.length > 0) {
        companyLead = await CompanyLead.findOne(companyQuery).session(session)
    }

    if (!companyLead) {
        const companyData = companyProspectusData.toObject()
        delete companyData._id
        delete companyData.deleted
        delete companyData.createdAt
        delete companyData.updatedAt;

        [companyLead] = await CompanyLead.create([companyData], { session })
    }

    // Create contact lead if contact exists
    let contactLead = null
    if (prospectus.contact) {
        const contactProspectusData = await ContactProspectus.findById(prospectus.contact).session(session)
        if (contactProspectusData) {
            const contactData = contactProspectusData.toObject()
            delete contactData._id
            delete contactData.deleted
            delete contactData.createdAt
            delete contactData.updatedAt;

            [contactLead] = await ContactLead.create([contactData], { session })
        }
    }

    // Create the lead
    await Lead.create(
        [{
            company: companyLead._id,
            contact: contactLead ? contactLead._id : null,
            status: prospectus.status || 'new',
            source: prospectus.source || null,
            followUp: prospectus.followUp || null,
            priority: prospectus.priority || 0,
            benificiary: prospectus.benificiary || undefined,
            createdBy: userId
        }],
        { session }
    )

    return companyLead._id
}

const updateProspectusById = async (tenantId, id, payload, userId) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Prospectus = prospectusModel(tenantId)
        const CompanyProspectus = companyProspectusModel(tenantId)
        const ContactProspectus = contactProspectusModel(tenantId)

        const prospectus = await Prospectus.findById(id).session(session)

        if (!prospectus) {
            throw new NotFoundError(404, 'Prospectus not found', ERROR_CODES.PROSPECTUS_NOT_FOUND, 'not_found')
        }

        const { company, leads, name, email, phone, department, remarks, status, source, followUp, priority, benificiary } = payload

        // Update company prospectus
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
                await CompanyProspectus.findByIdAndUpdate(
                    prospectus.company,
                    { $set: companyUpdateData },
                    { session, new: true }
                )
            }
        }

        // Update contact prospectus
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
            if (prospectus.contact) {
                await ContactProspectus.findByIdAndUpdate(
                    prospectus.contact,
                    { $set: contactUpdateData },
                    { session, new: true }
                )
            } else {
                const [newContact] = await ContactProspectus.create([{ ...contactUpdateData }], { session })
                prospectus.contact = newContact._id
            }
        }

        // Add new contacts
        if (leads && Array.isArray(leads) && leads.length > 0) {
            const leadsToProcess = []
            for (const leadData of leads) {
                const contactQuery = { 'deleted.isDeleted': false, $or: [] }

                if (leadData?.email && typeof leadData.email === 'string' && leadData.email.trim().length > 0) {
                    contactQuery.$or.push({
                        email: { $regex: `^${escapeRegex(leadData.email)}$`, $options: 'i' }
                    })
                }

                if (leadData?.phone?.number && typeof leadData.phone.number === 'string' && leadData.phone.number.trim().length > 0) {
                    contactQuery.$or.push({ 'phone.number': leadData.phone.number })
                }

                let exists = false
                if (contactQuery.$or.length > 0) {
                    const existingContact = await ContactProspectus.findOne(contactQuery).session(session)
                    if (existingContact) exists = true
                }

                if (!exists) leadsToProcess.push(leadData)
            }

            if (leadsToProcess.length > 0) {
                const contactsToInsert = leadsToProcess.map(leadData => {
                    const { status: _s, source: _src, followUp: _f, priority: _p, benificiary: _b, ...contactInfo } = leadData
                    return contactInfo
                })

                const insertedContacts = await ContactProspectus.insertMany(contactsToInsert, { session })

                const prospectusesToInsert = insertedContacts.map((contactProspectus, index) => {
                    const originalLead = leadsToProcess[index]
                    return {
                        company: prospectus.company,
                        contact: contactProspectus._id,
                        status: originalLead.status || 'new',
                        source: originalLead.source || null,
                        followUp: originalLead.followUp || null,
                        priority: originalLead.priority || 0,
                        benificiary: originalLead.benificiary || undefined,
                        createdBy: userId
                    }
                })

                await Prospectus.create(prospectusesToInsert, { session })
            }
        }

        // Update prospectus-level fields
        if (source !== undefined) prospectus.source = source
        if (followUp !== undefined) prospectus.followUp = followUp
        if (priority !== undefined) prospectus.priority = priority
        if (benificiary !== undefined) {
            if (benificiary && typeof benificiary === 'object') {
                Object.keys(benificiary).forEach(key => {
                    if (benificiary[key] === undefined) return

                    if (key === 'phone' && typeof benificiary.phone === 'object') {
                        Object.keys(benificiary.phone).forEach(phoneKey => {
                            if (benificiary.phone[phoneKey] !== undefined) {
                                if (!prospectus.benificiary) prospectus.benificiary = {}
                                if (!prospectus.benificiary.phone) prospectus.benificiary.phone = {}
                                prospectus.benificiary.phone[phoneKey] = benificiary.phone[phoneKey]
                            }
                        })
                    } else {
                        if (!prospectus.benificiary) prospectus.benificiary = {}
                        prospectus.benificiary[key] = benificiary[key]
                    }
                })
            } else {
                prospectus.benificiary = benificiary
            }
        }

        // Handle status change to qualified → convert to lead
        if (status !== undefined) {
            prospectus.status = status

            if (status === 'qualified') {
                if (prospectus.convertedToLead?.isConverted) {
                    throw new BadRequestError(
                        400,
                        'This prospectus has already been converted to a lead',
                        ERROR_CODES.PROSPECTUS_ALREADY_CONVERTED,
                        'bad_request'
                    )
                }

                const companyLeadId = await _convertProspectusToLead(tenantId, prospectus, userId, session)
                prospectus.convertedToLead = {
                    isConverted: true,
                    companyLeadId,
                    at: new Date()
                }
            }
        }

        await prospectus.save({ session })
        await session.commitTransaction()

        return await getAProspectusById(tenantId, id)
    } catch (error) {
        await session.abortTransaction()
        throw error
    } finally {
        session.endSession()
    }
}

const deleteProspectusById = async (tenantId, userId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Prospectus = prospectusModel(tenantId)
        const ContactProspectus = contactProspectusModel(tenantId)

        const prospectus = await Prospectus.findOne({
            _id: id,
            'deleted.isDeleted': false
        }).session(session)

        if (!prospectus) {
            throw new NotFoundError(404, 'Prospectus not found', ERROR_CODES.PROSPECTUS_NOT_FOUND, 'not_found')
        }

        prospectus.deleted = {
            isDeleted: true,
            at: new Date(),
            by: userId
        }
        await prospectus.save({ session })

        if (prospectus.contact) {
            await ContactProspectus.findByIdAndUpdate(
                prospectus.contact,
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

const restoreProspectusById = async (tenantId, userId, id) => {
    const session = await mongoose.startSession()

    try {
        session.startTransaction()

        const Prospectus = prospectusModel(tenantId)
        const ContactProspectus = contactProspectusModel(tenantId)

        const result = await Prospectus.updateOne(
            { _id: id, 'deleted.isDeleted': true },
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
            throw new NotFoundError(404, 'Prospectus not found or not deleted', ERROR_CODES.PROSPECTUS_NOT_FOUND, 'not_found')
        }

        const prospectus = await Prospectus.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(id) } }
        ]).session(session)

        if (prospectus[0]?.contact) {
            await ContactProspectus.updateOne(
                { _id: prospectus[0].contact },
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

module.exports = {
    createProspectus,
    bulkCreateProspectus,
    getAllProspectus,
    getAProspectusById,
    updateProspectusById,
    deleteProspectusById,
    restoreProspectusById
}
