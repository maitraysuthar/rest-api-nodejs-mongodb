var mongoose = require("mongoose");

const auth = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");
const apiResponse = require("../helpers/apiResponse");
const RoomType = require("../models/RoomTypeModel");
const { isSuperAdmin } = require("../helpers/user");
const { omitNullishObject } = require('../helpers/utility')
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
        const roomType = new RoomType(omitNullishObject({
            name: req.body.name,
            resort: req.body?.resort || undefined,
            quantity: req.body.quantity,
            price: req.body.price,
            maxAdult: req.body.maxAdult,
            maxChildren: req.body.maxChildren,
            allowCrypto: !!req.body.allowCrypto,
            capacity: req.body.quantity,
            imgs: req.body?.imgs || undefined,
            description: req.body?.description
        }));
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
        RoomType.find({ ...query, status: true }).populate('resort').then(roomTypes => {
            if (roomTypes.length > 0) {
                return apiResponse.successResponseWithData(res, "Operation success", roomTypes);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", []);
            }
        })
    }
];
exports.roomTypeUpdate = [
    auth,
    authAdmin,
    (req, res) => {
        var roomType = omitNullishObject(
            {
                name: req.body.name,
                resort: req.body?.resort || undefined,
                quantity: req.body.quantity,
                price: req.body.price,
                maxAdult: req.body.maxAdult,
                maxChildren: req.body.maxChildren,
                allowCrypto: req.body.allowCrypto,
                _id: req.params.id,
                imgs: req.body?.imgs || undefined,
                description: req.body?.description
            }
        )
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        RoomType.findById(req.params.id).then(foundRoomType => {
            if (!foundRoomType) return apiResponse.notFoundResponse(res, "Room type not exists with this id");
            //update room type.
            RoomType.findByIdAndUpdate(req.params.id, roomType, {}, function (err) {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                } else {
                    let roomTypeData = new RoomTypeData(roomType);
                    return apiResponse.successResponseWithData(res, "Room type update Success.", roomTypeData);
                }
            });
        })
    }
];

exports.roomTypeDelete = [
    auth,
    authAdmin,
    (req, res) => {
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        RoomType.findById(req.params.id).then(foundRoomType => {
            if (!foundRoomType) return apiResponse.notFoundResponse(res, "Room type not exists with this id");
            //update room type.
            RoomType.findByIdAndUpdate(req.params.id, {
                status: false
            }, {}, function (err) {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                } else {
                    return apiResponse.successResponseWithData(res, "Room type delete Success.");
                }
            });
        })
    }
];