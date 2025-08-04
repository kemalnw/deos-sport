const ROLE_CONSTANT = require('../constants/roleConstant');
module.exports = function (req, res, next) {
    if (req.loggedInUser.role_id === ROLE_CONSTANT.ADMIN_COMPANY || req.loggedInUser.role_id === ROLE_CONSTANT.ADMIN_ORGANIZATION || req.loggedInUser.role_id === ROLE_CONSTANT.SUPERADMIN) {
        next();
    }
    else {
        res.status(401)
            .json({ message: `you not authorized` })
    }
}