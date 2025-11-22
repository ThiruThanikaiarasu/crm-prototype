const refreshTokenModel = require("../models/refreshToken.model");

const storeRefreshToken = async (tenantId, data) => {
    const RefreshToken = refreshTokenModel(tenantId);
    return await RefreshToken.create({
        user: data.userId,
        token: data.refreshToken
    });
};

module.exports = {
    storeRefreshToken
};
