var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var Timeline = new Schema({
    room: { type: Schema.ObjectId, ref: "RoomType", required: true },
    price: { type: Number, required: true },
    sale: { type: Number, default: 0 },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    cryptoRoom: { type: Number, required: true },
    paymentRoom: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Timeline", Timeline);