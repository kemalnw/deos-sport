// Hanya Set allowedRoles
const ROLE_CONSTANT = require('../constants/roleConstant');
module.exports = function (req, res, next) {
    const { MEMBER } = ROLE_CONSTANT
    req.allowedRoles = [MEMBER]
    next();
}