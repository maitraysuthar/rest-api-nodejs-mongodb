var cron = require("node-cron");
const moment = require("moment");

const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");

cron.schedule(
    "0 * * * *",
    () => {
        const start = moment().subtract(process.env.RESERVATION_LIFE_PENDING, "hour").toDate();
        Reservation.updateMany({
            createdAt: {
                $lte: start
            },
            status: RESERVATION_STATUS.PENDING_PAYMENT
        }, {
            status: RESERVATION_STATUS.REJECTED
        }).then(() => {
            console.log("Reject reservation expired.", new Date());
        }, (error) => {
            console.error(error);
        });
    },
    {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    }
);