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
    if (status) {
        query.status = status
    }
    if (source) {
        query.source = { $regex: source, $options: 'i' }
    }
    if (followUp) {
        // Assuming exact match or simple date filtering for now.
        // For partial date match, we might need range logic later.
        // For now, let's assume it handles ISO string exact match if provided,
        // or we can allow simple date string filtering if needed.
        // Given 'followUp' is a Date in schema.
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
        Lead.find(query).sort(sortOptions).skip(skip).limit(parseInt(limit)),
        Lead.countDocuments(query),
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

module.exports = {
    createLead,
    getAllLeads,
}
