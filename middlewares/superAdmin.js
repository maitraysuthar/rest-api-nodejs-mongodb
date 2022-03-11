const {isSuperAdmin} = require('../helpers/user')
const apiResponse = require("../helpers/apiResponse");

exports.authSuperAdmin = (req, res,next) => {
    const superAdmin = isSuperAdmin(req?.user)
    if (!superAdmin) {
        return apiResponse.validationErrorWithData(res, "Permission denied.", req.user.email);
    }
    return next()
}