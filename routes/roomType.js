var express = require("express");
const RoomTypeController = require("../controllers/RoomTypeController");

var router = express.Router();

router.get("/", RoomTypeController.roomTypeList);
router.get("/:id", RoomTypeController.roomDetail);
router.get("/resort/:id", RoomTypeController.roomTypeListByResort);
router.post("/", RoomTypeController.roomTypeStore);
router.put("/:id", RoomTypeController.roomTypeUpdate);
router.delete("/:id", RoomTypeController.roomTypeDelete);
router.post("/search", RoomTypeController.roomTypeSearch);
router.post("/suggest", RoomTypeController.getRoomTypeSuggestion);

module.exports = router;