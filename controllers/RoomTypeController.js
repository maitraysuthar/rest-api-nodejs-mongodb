var mongoose = require("mongoose");
var bluebird = require("bluebird");
const auth = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");
const apiResponse = require("../helpers/apiResponse");
const RoomType = require("../models/RoomTypeModel");
const RoomTypeService = require('../services/RoomTypeService')
const { isSuperAdmin } = require("../helpers/user");
const { omitNullishObject, deleteFiles } = require('../helpers/utility')
const { upload } = require('../controllers/UploadController');
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");

function RoomTypeData(data) {
    return {
        id: data._id,
        name: data.name,
        resort: data.resort
    };
}
/**
 * New Room
 */
exports.roomTypeStore = [
    auth,
    authAdmin,
    upload.array("files", 5),
    (req, res) => {
        const rooms = req.body.resort.split(',').map(resort => new RoomType(omitNullishObject({
            name: req.body.name,
            resort,
            price: req.body.price,
            maxAdult: req.body.maxAdult,
            maxChildren: req.body.maxChildren,
            cryptoRoom: req.body.cryptoRoom,
            paymentRoom: req.body.paymentRoom,
            imgs: req?.files?.map(f => f.path),
            description: req.body?.description,
            sale: Number(req.body?.sale) || undefined
        })))

        const taskVerifyExistRoom = rooms.map(room => {
            return new Promise((resolve, reject) => {
                RoomType.findOne({ name: room.name, resort: mongoose.Types.ObjectId(room.resort) }).populate('resort').then(foundRoom => {
                    if (foundRoom) return reject(new Error(`Duplicate room ${foundRoom.name} at resort ${foundRoom.resort.name}`))
                    return resolve()
                })
            })
        })

        bluebird.all(taskVerifyExistRoom).then(() => {
            RoomType.insertMany(rooms, function (err) {
                if (err) { return apiResponse.ErrorResponse(res, err); }
                return apiResponse.successResponse(res, "RoomType add Success.")
            })
        }).catch(error => {
            return apiResponse.ErrorResponse(res, error.message)
        })
    }
];
/**
 * Fetch list room by admin
 */
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
        RoomTypeService.roomTypeList(req.user, (error, rooms) => {
            if (error) return apiResponse.ErrorResponse(res, error)
            if (rooms?.length > 0) {
                return apiResponse.successResponseWithData(res, "Operation success", rooms);
            } else {
                return apiResponse.successResponseWithData(res, "Operation success", []);
            }
        })
    }
];
/**
 * Fetch room detail by client
 */
exports.roomDetail = [
    (req, res) => {
        RoomTypeService.roomTypeDetail({
            checkIn: getCheckInTimeToDate(req.query.checkIn),
            checkOut: getCheckOutTimeToDate(req.query.checkOut),
            roomtype: req.params.id
        }, (error, room) => {
            if (error) return apiResponse.ErrorResponse(res, error)
            return apiResponse.successResponseWithData(res, "Operation success", room);
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
        RoomTypeService.roomTypeSearch(req.body, (error, rooms) => {
            return apiResponse.successResponseWithData(res, "Operation success", rooms);
        })
    }
]

exports.getRoomTypeSuggestion = [
    (req, res) => {
        RoomTypeService.getRoomTypeSuggestion(req.body, (error, rooms) => {
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
                // resort: req.body?.resort?.split(',') || undefined || undefined,
                price: req.body.price,
                maxAdult: req.body.maxAdult,
                maxChildren: req.body.maxChildren,
                cryptoRoom: req.body.cryptoRoom,
                paymentRoom: req.body.paymentRoom,
                _id: req.params.id,
                imgs: req.body?.imgs || undefined,
                description: req.body?.description,
                sale: Number(req?.body?.sale) ?? undefined
            }
        )
        if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
            return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
        }
        RoomType.findById(req.params.id).then(foundRoomType => {
            if (!foundRoomType) return apiResponse.notFoundResponse(res, "Room type not exists with this id");
            let removeImgs = []
            //update img
            if (req.files) {
                const imgs = foundRoomType.imgs
                const newImgs = req.files.map(f => f.path);
                removeImgs = req.body.imgsRemoved && req.body.imgsRemoved.split(',') || []
                const updateImgs = [...imgs, ...newImgs].filter(img => !removeImgs.includes(img))
                roomType.imgs = updateImgs
            }

            RoomType.findByIdAndUpdate(req.params.id, roomType, {}, function (err) {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                } else {
                    // clean image
                    removeImgs && deleteFiles(removeImgs.map(path => './' + path), (err) => {
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
                status: !foundRoomType.status
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