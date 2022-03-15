const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: "User", unique: true },
    token: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("RefreshToken", schema);