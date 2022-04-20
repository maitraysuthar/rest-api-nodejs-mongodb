var express = require("express");
const TimelineController = require("../controllers/TimelineController");

var router = express.Router();

router.post("/", TimelineController.createTimeline);
router.put("/:id", TimelineController.updateTimeline);

module.exports = router;