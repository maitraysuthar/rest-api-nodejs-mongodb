var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var AutorSchema = new Schema({
	Nombre: {type: String, required: true},
	Apellido: {type: String, required: true},
}, {timestamps: true});

module.exports = mongoose.model("Autor", AutorSchema);