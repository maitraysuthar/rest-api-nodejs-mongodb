var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var RoomTypeSchema = new Schema({
    name: { type: String, required: true },
    resort: { type: Schema.ObjectId, ref: "Resort", required: true },
    capacity: { type: Number, required: true, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("RoomType", RoomTypeSchema);