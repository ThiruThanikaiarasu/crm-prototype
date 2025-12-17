const leadModel = require('../models/lead.model')

const createLead = async ({
    company,
    contact,
    phone,
    email,
    status,
    source,
    followUp,
    owner,
    tenantId,
}) => {
    const Lead = leadModel(tenantId)

    return await Lead.create({
        company,
        contact,
        phone,
        email,
        status,
        source,
        followUp,
        owner,
    })
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
        throw new Error('Lead not found')
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
        throw new Error('Lead not found')
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
