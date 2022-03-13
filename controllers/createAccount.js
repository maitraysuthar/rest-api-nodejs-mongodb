const UserModel = require("../models/UserModel");
const bcrypt = require("bcrypt");
var mongoose = require("mongoose");

const email = 'admin'
const passowrd = '$2a$10$&#x2F;NoizzTWB72lJj3WEidJquyt10vcOpf2yYPmu4rJGpirCy93lUhOO'

const main = async () => {
    var MONGODB_URL = 'mongodb://127.0.0.1:27017/heron';
    mongoose.connect(MONGODB_URL, { useNewUrlParser: true, useUnifiedTopology: true }).then(() => {
        //don't show the log when it is test
        if (process.env.NODE_ENV !== "test") {
            console.log("Connected to %s", MONGODB_URL);
            console.log("App is running ... \n", UserModel.SUPER_ADMIN);
            console.log("Press CTRL + C to stop the process. \n");
        }
        bcrypt.hash(passowrd, 10, function (err, hash) {
            // generate OTP for confirmation
            // Create User object with escaped and trimmed data
            var user = new UserModel(
                {
                    email,
                    password: hash,
                    isConfirmed: 1,
                    confirmOTP: null,
                    role: 0
                }
            );
            user.save();
        });
    })
        .catch(err => {
            console.error("App starting error:", err.message);
            process.exit(1);
        });

}
main()
module.exports = main