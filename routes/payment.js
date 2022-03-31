var express = require("express");
var router = express.Router();
const PaymentController = require("../controllers/PaymentController");

router.post("/url", PaymentController.getUrl);
router.post("/vnpay_return", PaymentController.vnpReturn);
router.post("/vnpay_ipn", PaymentController.vnpReturn);
router.get("/cancel", PaymentController.requestCancel);
router.post("/refund/:id", PaymentController.refund);

module.exports = router;

