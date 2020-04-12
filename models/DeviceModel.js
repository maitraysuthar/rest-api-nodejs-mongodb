var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var DeviceSchema = new Schema({
	user_id: {type: Number, required: true},
	temperature: {type: Number, required: true},
    rh: {type: Number, required: true},
    os_ver: {type: String, required: true},
    heater_status: {type: Boolean, required: true, status: 0},
}, {timestamps: true});

module.exports = mongoose.model("Device", DeviceSchema);