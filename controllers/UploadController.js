const multer = require("multer");


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

module.exports = {
	upload
};