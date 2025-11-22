const userModel = require("../models/user.model");

const registerUser = async ({ firstName, lastName, email, password, role, tenantId }) => {
    const User = userModel(tenantId);

    return await User.create({
        firstName,
        lastName,
        email,
        password,
        role,
        tenantId
    });
};

const findUserByEmail = async (email, tenantId) => {
    const User = userModel(tenantId);
    return await User.findOne({ email }).select("+password");
};

module.exports = {
    registerUser,
    findUserByEmail
};