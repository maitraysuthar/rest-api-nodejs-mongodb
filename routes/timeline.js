var express = require("express");
const TimelineController = require("../controllers/TimelineController");

var router = express.Router();

router.post("/", TimelineController.createTimeline);
router.put("/:id", TimelineController.updateTimeline);

router.get("/event", TimelineController.getTimelineEvent);
router.post("/event", TimelineController.createTimelineEvent);
router.put("/event/:id", TimelineController.updateTimelineEvent);

module.exports = router;