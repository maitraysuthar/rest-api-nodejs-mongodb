var cron = require("node-cron");
const moment = require("moment");

const Reservation = require("../models/ReservationModel");
const { RESERVATION_STATUS } = require("../constants/index");
/**
 * Job clean pendding payment
 */
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
            console.log("Reject reservation expired.", moment(moment.now()).toDate());
        }, (error) => {
            console.error(error);
        });
    },
    {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    }
);


/**
 * Job checkout
 */
cron.schedule(
    "0 0 11 * * *",
    () => {
        const now = moment().toDate();
        Reservation.updateMany({
            checkOut: {
                $lte: now
            },
            status: RESERVATION_STATUS.PENDING_COMPLETED
        }, {
            status: RESERVATION_STATUS.COMPLETED
        }).then(() => {
            console.log("AUTO checkout reservation.", moment(moment.now()).toDate());
        }, (error) => {
            console.error(error);
        });
    },
    {
        scheduled: true,
        timezone: "Asia/Ho_Chi_Minh"
    }
);
