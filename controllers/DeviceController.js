const Device = require("../models/DeviceModel");
const { body,validationResult } = require("express-validator");
const { sanitizeBody } = require("express-validator");
const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");
var mongoose = require("mongoose");
mongoose.set("useFindAndModify", false);

// Device Schema
function DeviceData(data) {
	this.id = data._id;
	this.user_id= data.userid;
	this.temperature = data.temperature;
    this.rh = data.rh;
    this.os_ver = data.osver;
    this.heater_status = data.heaterstatus;
	this.createdAt = data.createdAt;
}

/**
 * Device List.
 * 
 * @returns {Object}
 */
exports.deviceList = [
	auth,
	function (req, res) {
		try {
			Device.find({user_id: req.user_id},"_id user_id temperature rh  os_ver heater_status createdAt").then((devices)=>{
				if(devices.length > 0){
					return apiResponse.successResponseWithData(res, "Operation success", books);
				}else{
					return apiResponse.successResponseWithData(res, "Operation success", []);
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Device store.
 * 
 * @param {string}      user_id 
 * @param {string}      temperature
 * @param {string}      rh
 * @param {string}      os_ver
 * @param {string}      heater_status
 * 
 * 
 * @returns {Object}
 */
exports.deviceStore = [
	auth,
    body("temperature", "temperature must not be empty.").isNumeric().trim(),
    body("rh", "rh must not be empty.").isNumeric().trim(),
    body("os_ver", "os_ver must not be empty.").isLength({ min: 1 }).trim(),
    body("heater_status", "heater_status must not be empty.").isNumeric().trim(),
	body("user_id", "User id must not be empty.").isNumeric().trim().custom((value,{req}) => {
		return Device.findOne({user_id: req.user_id}).then(device => {
			if (device) {
				return Promise.reject("Device already exist");
			}
		});
	}),
	sanitizeBody("*").escape(),
	(req, res) => {
		try {
            console.log("AE")
            const errors = validationResult(req);
            console.log(req.body)
            console.log(errors.errors)
			var device = new Device(
                { user_id: req.body.user_id,
                  temperature: req.body.temperature,
                  rh: req.body.rh,
                  os_ver: req.body.os_ver,
                  heater_status: req.body.heater_status,
                });
			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				//Save device.
				device.save(function (err) {
					if (err) { return apiResponse.ErrorResponse(res, err); }
					let bookData = new DeviceData(device);
					return apiResponse.successResponseWithData(res,"Book add Success.", bookData);
				});
			}
		} catch (err) {
            //throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];



/**
 * Device Detail.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.deviceDetail = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.successResponseWithData(res, "Operation success", {});
		}
		try {
			Device.findOne({_id: req.params.id,user: req.user._id},"_id title description isbn createdAt").then((book)=>{                
				if(book !== null){
					let bookData = new BookData(book);
					return apiResponse.successResponseWithData(res, "Operation success", bookData);
				}else{
					return apiResponse.successResponseWithData(res, "Operation success", {});
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Device update.
 * 
 * @param {string}      title 
 * @param {string}      description
 * @param {string}      isbn
 * 
 * @returns {Object}
 */
exports.deviceUpdate = [
	auth,
	body("title", "Title must not be empty.").isLength({ min: 1 }).trim(),
	body("description", "Description must not be empty.").isLength({ min: 1 }).trim(),
	body("isbn", "ISBN must not be empty").isLength({ min: 1 }).trim().custom((value,{req}) => {
		return Device.findOne({isbn : value,user: req.user._id, _id: { "$ne": req.params.id }}).then(book => {
			if (book) {
				return Promise.reject("Book already exist with this ISBN no.");
			}
		});
	}),
	sanitizeBody("*").escape(),
	(req, res) => {
		try {
			const errors = validationResult(req);
			var book = new Book(
				{ title: req.body.title,
					description: req.body.description,
					isbn: req.body.isbn,
					_id:req.params.id
				});

			if (!errors.isEmpty()) {
				return apiResponse.validationErrorWithData(res, "Validation Error.", errors.array());
			}
			else {
				if(!mongoose.Types.ObjectId.isValid(req.params.id)){
					return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
				}else{
					Device.findById(req.params.id, function (err, foundBook) {
						if(foundBook === null){
							return apiResponse.notFoundResponse(res,"Book not exists with this id");
						}else{
							//Check authorized user
							if(foundBook.user.toString() !== req.user._id){
								return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
							}else{
								//update book.
								Device.findByIdAndUpdate(req.params.id, book, {},function (err) {
									if (err) { 
										return apiResponse.ErrorResponse(res, err); 
									}else{
										let bookData = new BookData(book);
										return apiResponse.successResponseWithData(res,"Book update Success.", bookData);
									}
								});
							}
						}
					});
				}
			}
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];

/**
 * Device Delete.
 * 
 * @param {string}      id
 * 
 * @returns {Object}
 */
exports.deviceDelete = [
	auth,
	function (req, res) {
		if(!mongoose.Types.ObjectId.isValid(req.params.id)){
			return apiResponse.validationErrorWithData(res, "Invalid Error.", "Invalid ID");
		}
		try {
			Device.findById(req.params.id, function (err, foundBook) {
				if(foundBook === null){
					return apiResponse.notFoundResponse(res,"Book not exists with this id");
				}else{
					//Check authorized user
					if(foundBook.user.toString() !== req.user._id){
						return apiResponse.unauthorizedResponse(res, "You are not authorized to do this operation.");
					}else{
						//delete book.
						Device.findByIdAndRemove(req.params.id,function (err) {
							if (err) { 
								return apiResponse.ErrorResponse(res, err); 
							}else{
								return apiResponse.successResponse(res,"Book delete Success.");
							}
						});
					}
				}
			});
		} catch (err) {
			//throw error in json response with status 500. 
			return apiResponse.ErrorResponse(res, err);
		}
	}
];