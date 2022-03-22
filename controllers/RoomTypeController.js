var mongoose = require("mongoose");

const auth = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");
const apiResponse = require("../helpers/apiResponse");
const RoomType = require("../models/RoomTypeModel");
const RoomTypeService = require('../services/RoomTypeService')
const { isSuperAdmin } = require("../helpers/user");
const { omitNullishObject, deleteFiles } = require('../helpers/utility')
const { upload } = require('../controllers/UploadController')

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
    upload.array("files", 5),
    (req, res) => {
        const roomType = new RoomType(omitNullishObject({
            name: req.body.name,
            resort: req.body?.resort?.split(',') || undefined,
            quantity: req.body.quantity,
            price: req.body.price,
            maxAdult: req.body.maxAdult,
            maxChildren: req.body.maxChildren,
            allowCrypto: !!req.body.allowCrypto,
            capacity: req.body.quantity,
            imgs: req?.files?.map(f => f.path),
            description: req.body?.description,
            sale: Number(req.body?.sale) || undefined
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
exports.roomDetail = [
    (req,res)=>{
        RoomType.findById(req.params.id).populate('resort').then(roomTypes => {
            if (roomTypes) {
                return apiResponse.successResponseWithData(res, "Operation success", roomTypes);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", null);
            }
        })
    }
]
exports.roomTypeListByResort = [
    (req, res) => {
        let query = {
            resort: {
                $in: req.params.id
            },
            maxAdult: {
                $gte: req.params.maxAdult
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
exports.roomTypeSearch = [
    (req, res) => {
        RoomTypeService.searchRoom(req.body, (error, rooms) => {
            return apiResponse.successResponseWithData(res, "Operation success", rooms);
        })
    }
]
exports.roomTypeUpdate = [
    auth,
    authAdmin,
    upload.array("files", 5),
    (req, res) => {
        var roomType = omitNullishObject(
            {
                name: req.body.name,
                resort: req.body?.resort?.split(',') || undefined || undefined,
                quantity: req.body.quantity,
                price: req.body.price,
                maxAdult: req.body.maxAdult,
                maxChildren: req.body.maxChildren,
                allowCrypto: req.body.allowCrypto,
                _id: req.params.id,
                imgs: req.body?.imgs || undefined,
                description: req.body?.description,
                sale: Number(req?.body?.sale) || undefined
            }
        )
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        RoomType.findById(req.params.id).then(foundRoomType => {
            if (!foundRoomType) return apiResponse.notFoundResponse(res, "Room type not exists with this id");

            //update capacity.
            const capacity = foundRoomType.capacity
            const newCapacity = roomType.quantity ? capacity + (roomType.quantity - foundRoomType.quantity) : null
            if (newCapacity) {
                roomType.capacity = newCapacity
            }

            //update img
            const imgs = foundRoomType.imgs
            const newImgs = req.files.map(f => f.path);
            const removeImgs = req.body.imgsRemoved && req.body.imgsRemoved.split(',') || []
            const updateImgs = [...imgs, ...newImgs].filter(img => !removeImgs.includes(img))
            roomType.imgs = updateImgs

            RoomType.findByIdAndUpdate(req.params.id, roomType, {}, function (err) {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                } else {
                    // clean image
                    deleteFiles(removeImgs.map(path => './' + path), (err) => {
                        if (err) return apiResponse.ErrorResponse(res, err);

                        let roomTypeData = new RoomTypeData(roomType);
                        return apiResponse.successResponseWithData(res, "Room type update Success.", roomTypeData);
                    })
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