const { pickBy, isNil, negate } = require("lodash");
const fs = require("fs");

/**
 * Random OTP
 * @param {*} length 
 * @returns string
 */
exports.randomNumber = function (length) {
	var text = "";
	var possible = "123456789";
	for (var i = 0; i < length; i++) {
		var sup = Math.floor(Math.random() * possible.length);
		text += i > 0 && sup == i ? "0" : possible.charAt(sup);
	}
	return Number(text);
};
/**
 * Remove undefined and null values from an object
 * @param value 
 * @returns Object
 */
exports.omitNullishObject = (value) => pickBy(value, negate(isNil));

exports.deleteFiles = (files, callback) => {
	try {
		files.forEach(path => fs.existsSync(path) && fs.unlinkSync(path));
		callback(null);
		// success code here
	} catch (err) {
		// error handling here
		callback(err);
	}
};