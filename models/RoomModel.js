var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var RoomSchema = new Schema({
    code: { type: String, required: true, unique: true },
    description: { type: String },
    roomtype: { type: Schema.ObjectId, ref: "RoomType", required: true },
    price: { type: Number, required: true },
    maxAdult: { type: Number, required: true },
    maxChildren: { type: Number, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Room", RoomSchema);