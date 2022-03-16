const { authAdmin } = require("../middlewares/role");
const multer = require("multer");
const fs = require("fs");

const apiResponse = require("../helpers/apiResponse");
const auth = require("../middlewares/jwt");

const MIME_TYPE_MAP = {
	"image/png": "png",
	"image/jpeg": "jpeg",
	"image/jpg": "jpg"
};

const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, "./public/uploads");
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1E9);
		cb(null, uniqueSuffix + "." + file.mimetype.split("/").reverse()[0]);
	}
});


const upload = multer({
	storage,
	fileFilter: (req, file, cb) => {
		const isValid = !!MIME_TYPE_MAP[file.mimetype];
		let error = isValid ? null : new Error("Invalid mime type!");
		cb(error, isValid);
	}
});

const create = [
	auth,
	authAdmin,
	upload.array("files", 5),
	(req, res) => {
		return apiResponse.successResponseWithData(res, "File update Success.", req.files);
	}
];

const update = [
	authAdmin,
	(req, res) => {

	}
];

const remove = [
	auth,
	authAdmin,
	(req, res) => {
		// "path": "public/uploads/1647312581810-866337763.jpeg",
		const path = "./" + req.query.path;
		fs.unlink(path, (err) => {
			if (err) {
				return apiResponse.successResponseWithData(res, "File remove not exist.");
			} else {
				return apiResponse.successResponseWithData(res, "File remove Success.", { path });
			}
		});
	}
];

module.exports = {
	create,
	update,
	remove,
	upload
};