var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var ROLE = {
	SUPER_ADMIN: 0,
	ADMIN: 1,
	VIEW: 2
};

var UserSchema = new mongoose.Schema({
	email: { type: String, required: true, unique: true },
	password: { type: String, required: true },
	isConfirmed: { type: Boolean, required: true, default: 0 },
	confirmOTP: { type: String, required: false },
	otpTries: { type: Number, required: false, default: 0 },
	status: { type: Boolean, required: true, default: true },
	role: { type: Number, required: true, default: ROLE.VIEW },
	resort: [{ type: Schema.ObjectId, ref: "Resort" }],
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);