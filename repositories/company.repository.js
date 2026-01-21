const companyLeadModel = require('../models/companyLead.model')
const {
    paginationFacetStage,
    formatPaginationResult
} = require('./aggregate.repository')

/**
 * Search companies with pagination
 * @param {string} tenantId
 * @param {object} options
 * @returns {Promise<object>}
 */
const searchCompaniesWithPagination = async (tenantId, options = {}) => {
    const { search = '', page = 1, limit = 10 } = options

    const CompanyLead = companyLeadModel(tenantId)

    const matchStage = {
        'deleted.isDeleted': false
    }

    if (search) {
        matchStage.name = { $regex: search, $options: 'i' }
    }

    const skip = (page - 1) * limit

    const result = await CompanyLead.aggregate([
        { $match: matchStage },
        {
            $facet: {
                data: [
                    { $sort: { name: 1 } },
                    { $skip: skip },
                    { $limit: Number(limit) },
                    { $project: { deleted: 0 } }
                ],
                totalCount: [
                    { $count: 'count' }
                ]
            }
        }
    ])

    const formatted = formatPaginationResult(result, page, limit)

    return {
        companies: formatted.data,
        info: formatted.info
    }
}

module.exports = {
    searchCompaniesWithPagination
}
