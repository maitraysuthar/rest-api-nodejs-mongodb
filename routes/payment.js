var express = require("express");
var router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/url", PaymentController.getUrl);
router.post("/ipn", PaymentController.ipn);

module.exports = router;

