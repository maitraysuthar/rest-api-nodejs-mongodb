var express = require("express");
const ResortController = require("../controllers/ResortController");

var router = express.Router();

router.get("/", ResortController.resortList);
router.post("/", ResortController.resortStore);

module.exports = router;