var express = require("express");
const RoomController = require("../controllers/RoomController");

var router = express.Router();

router.get("/", RoomController.roomList);
router.post("/", RoomController.roomStore);
// router.put("/:id", RoomController.roomUpdate);
// router.delete("/:id", RoomController.roomDelete);

module.exports = router;