var express = require("express");
const ReservationController = require("../controllers/ReservationController");

var router = express.Router();

router.get("/", ReservationController.reservationList);
router.post("/sign", ReservationController.sign);
router.post("/", ReservationController.reservationStore);
router.put("/checkout/:id", ReservationController.checkout);
router.put("/cancel", ReservationController.cancel);

module.exports = router;