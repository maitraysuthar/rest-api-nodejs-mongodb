var express = require("express");
const ResortController = require("../controllers/ResortController");

var router = express.Router();

router.get("/", ResortController.resortList);
router.get("/all", ResortController.resortAll);
router.post("/", ResortController.resortStore);
router.delete("/:id", ResortController.resortDelete);
router.put("/:id", ResortController.resortUpdate);

module.exports = router;