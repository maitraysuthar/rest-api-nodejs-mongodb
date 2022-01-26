var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var SongSchema = new Schema({
	Nombre: {type: String, required: true},
	Apellido: {type: String, required: true},
}, {timestamps: true});

module.exports = mongoose.model("Song", SongSchema);