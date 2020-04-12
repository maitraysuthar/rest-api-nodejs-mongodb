var express = require("express");
const DeviceController = require("../controllers/DeviceController");

var router = express.Router();

router.get("/", DeviceController.deviceList);
router.get("/:id", DeviceController.deviceDetail);
router.post("/", DeviceController.deviceStore);
router.put("/:id", DeviceController.deviceUpdate);
router.delete("/:id", DeviceController.deviceDelete);

module.exports = router;