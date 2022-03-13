const { body, validationResult } = require("express-validator");

const authenticate = require("../middlewares/jwt");
const { authAdmin } = require("../middlewares/role");

const Room = require("../models/RoomModel");
const RoomType = require("../models/RoomTypeModel");

const apiResponse = require("../helpers/apiResponse");
const RoomTypeService = require("../services/RoomTypeService");

function RoomTypeData(data) {
    return {
        code: data.code,
        roomtype: data.roomtype,
        price: data.price,
        maxAdult: data.maxAdult,
        maxChildren: data.maxChildren
    };
}

exports.roomStore = [
    authenticate,
    authAdmin,
    body("code", "code must not be empty").isLength({ min: 1 }).trim().custom((value) => {
        return Room.findOne({ code: value }).then(room => {
            if (room) {
                return Promise.reject("Room already exist with this code: " + value);
            }
        });
    }),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
        }
        const room = new Room({
            code: req.body.code,
            description: req.body.description,
            roomtype: req.body.roomtype,
            price: req.body.price,
            maxAdult: req.body.maxAdult,
            maxChildren: req.body.maxChildren
        });

        room.save(function (err) {
            if (err) {
                return apiResponse.ErrorResponse(res, err);
            }
            let roomTypeData = new RoomTypeData(room);
            return apiResponse.successResponseWithData(res, "Room add Success.", roomTypeData);
        });
    }
];

exports.roomList = [
    authenticate,
    (req, res) => {
        RoomTypeService.findByUser(req.user, (err, roomTypes) => {
            Room.find({
                roomtype: {
                    $in: roomTypes
                }
            }, (err, rooms) => {
                if (err) {
                    return apiResponse.ErrorResponse(res, err);
                }
                return apiResponse.successResponseWithData(res, "RoomType add Success.", rooms);
            })
        })


    }
]