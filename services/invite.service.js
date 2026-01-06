const organizationInviteModel = require("../models/organizationInvite.model")

const checkIfInviteAlreadyAccepted = async (tenantId, email) => {
    const OrganizationInvite = organizationInviteModel(tenantId)
    const invite = await OrganizationInvite.findOne({ email: email })
    console.log(invite)
    if (invite.status == 'accepted' || invite.status == 'rejected') {
        return true
    }
    return false
}

module.exports = {
    checkIfInviteAlreadyAccepted
}