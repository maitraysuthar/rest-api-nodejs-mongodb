var MONGODB_URL = "mongodb://127.0.0.1:27017/heron";
const moment = require("moment");
const Reservations = require("../models/ReservationModel");
var mongoose = require("mongoose");
mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
    //don't show the log when it is test
    if (process.env.NODE_ENV !== "test") {
        console.log("Connected to %s", MONGODB_URL);
        console.log("App is running ... \n");
        console.log("Press CTRL + C to stop the process. \n");
    }
    modifyCheckInOut();
})
    .catch(err => {
        console.error("App starting error:", err.message);
        process.exit(1);
    });

const modifyCheckInOut = () => {
    Reservations.find({}).lean().then((docs) => {
        Reservations.bulkWrite(
            docs.map(doc => ({
                updateOne: {
                    filter: { status: true },
                    update: {
                        status: 1
                    }
                }
            }))
        ).then(res => {
            // Prints "1 1 1"
            console.log(res.insertedCount, res.modifiedCount, res.deletedCount);
        });
    });
};