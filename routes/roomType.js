var express = require("express");
const RoomTypeController = require("../controllers/RoomTypeController");

var router = express.Router();

router.get("/", RoomTypeController.roomTypeList);
router.post("/", RoomTypeController.roomTypeStore);
router.put("/:id", RoomTypeController.roomTypeUpdate);
router.delete("/:id", RoomTypeController.roomTypeDelete);

module.exports = router;