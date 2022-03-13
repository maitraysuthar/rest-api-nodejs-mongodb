const auth = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");
const apiResponse = require("../helpers/apiResponse");
const RoomType = require("../models/RoomTypeModel");
const { isSuperAdmin } = require("../helpers/user");

function RoomTypeData(data) {
    return {
        id: data._id,
        name: data.name,
        resort: data.resort
    };
}

exports.roomTypeStore = [
    auth,
    authAdmin,
    (req, res) => {
        const roomType = new RoomType({
            name: req.body.name,
            resort: req.body.resort
        });
        roomType.save(function (err) {
            if (err) { return apiResponse.ErrorResponse(res, err); }
            let roomTypeData = new RoomTypeData(roomType);
            return apiResponse.successResponseWithData(res, "RoomType add Success.", roomTypeData);
        });
    }
];
exports.roomTypeList = [
    auth,
    (req, res) => {
        let query = {}
        if (!isSuperAdmin(req.user)) {
            query = {
                resort: {
                    $in: req.user.resort
                }
            }
        }
        RoomType.find(query, (err, roomTypes) => {
            if (roomTypes.length > 0) {
                return apiResponse.successResponseWithData(res, "Operation success", roomTypes);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", []);
            }
        })
    }
];
exports.roomTypeUpdate = [

];

exports.roomTypeDelete = [

];