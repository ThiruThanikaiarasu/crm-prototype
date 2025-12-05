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

const getAllLeads = async (tenantId) => {
    const Lead = leadModel(tenantId)
    return await Lead.find()
}

module.exports = {
    createLead,
    getAllLeads,
}
