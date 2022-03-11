var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ResortSchema = new Schema({
	name: { type: String, required: true },
	description: { type: String },
	city: { type: Number, default: 0 },
	status: { type: Number, default: 1 }
}, { timestamps: true });

module.exports = mongoose.model("Resort", ResortSchema);