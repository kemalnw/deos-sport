// Hanya Set allowedRoles
const ROLE_CONSTANT = require('../constants/roleConstant');
module.exports = function (req, res, next) {
    const { ADMIN_COMPANY, ADMIN_ORGANIZATION, SUPERADMIN } = ROLE_CONSTANT
    req.allowedRoles = [ADMIN_COMPANY, ADMIN_ORGANIZATION, SUPERADMIN]
    next();
}