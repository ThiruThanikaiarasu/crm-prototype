const userModel = require('../models/user.model')

const findUserByEmail = async (email, tenantId) => {
    const User = userModel(tenantId)
    return await User.findOne({ email }).select('+password')
}

const fetchUserProfileData = async (userId, tenantId) => {
    const User = userModel(tenantId)
    return await User.findById(userId)
}

module.exports = {
    findUserByEmail,
    fetchUserProfileData,
}
