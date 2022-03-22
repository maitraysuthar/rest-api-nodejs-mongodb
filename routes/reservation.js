var express = require("express");
const ReservationController = require("../controllers/ReservationController");

var router = express.Router();

router.get("/", ReservationController.reservationList);
router.post("/", ReservationController.reservationStore);

module.exports = router;