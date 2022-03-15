var express = require("express");
const UploadController = require("../controllers/UploadController");

var router = express.Router();

// router.get("/", UploadController.roomTypeList);
router.post("/", UploadController.create);
router.put("/:id", UploadController.update);
router.delete("/", UploadController.remove);

module.exports = router;