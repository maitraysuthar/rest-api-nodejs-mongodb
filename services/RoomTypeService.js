const { isSuperAdmin } = require("../helpers/user");
const RoomType = require('../models/RoomTypeModel')

exports.findByUser = (user, cb) => {
    const { resort } = user;
    let query = {}
    if (!isSuperAdmin(user)) {
        query = {
            resort: {
                $in: resort
            }
        }
    }
    RoomType.find(query, cb);
}