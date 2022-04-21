var mongoose = require("mongoose");
var { TIMELINE_EVENT } = require("../constants/index");
var Schema = mongoose.Schema;

var Timeline = new Schema({
	room: { type: Schema.ObjectId, ref: "RoomType", required: true },
	price: { type: Number, required: true },
	sale: { type: Number, default: 0 },
	type: {
		type: String,
		enum: Object.keys(TIMELINE_EVENT),
		default: Object.keys(TIMELINE_EVENT)[0]
	},
	cryptoRoom: { type: Number, required: true },
	paymentRoom: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("TimelineEvent", Timeline);