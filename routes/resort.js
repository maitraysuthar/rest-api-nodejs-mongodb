var express = require("express");
const ResortController = require("../controllers/ResortController");

var router = express.Router();

router.get("/", ResortController.resortList);
router.post("/", ResortController.resortStore);
router.delete("/:id", ResortController.resortDelete);
router.put("/:id", ResortController.resortUpdate);

module.exports = router;