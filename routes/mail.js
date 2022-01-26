var express = require("express");
const MailController = require("../controllers/MailController");

var router = express.Router();

router.post("/send", MailController.sendMail);

module.exports = router;