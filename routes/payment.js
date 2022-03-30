var express = require("express");
var router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/url", PaymentController.getUrl);
router.post("/vnpay_return",PaymentController.vnpReturn);
router.post("/vnpay_ipn",PaymentController.vnpReturn);

module.exports = router;

