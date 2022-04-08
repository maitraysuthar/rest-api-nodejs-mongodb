const { pickBy, isNil, negate, flatten } = require("lodash");
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

exports.contains = (arr1, mainObj) => arr1.some(el => el in mainObj);
/**
 * Generate all combinations of an array.
 * @param {Array} sourceArray - Array of input elements.
 * @param {number} min - min Desired length of combinations.
 * @param {number} max - max Desired length of combinations.
 * @return {Array} Array of combination arrays.
 */
exports.generateCombinations = (arr, min = 1, max) => {
	const combination = (arr, depth) => {
		if (depth === 1) {
			return arr.map(e => [e]);
		} else {
			const result = combination(arr, depth - 1).flatMap((val) =>
				arr.map((char) => flatten([val, char]))
			);
			return arr.concat(result);
		}
	};

	return combination(arr, max).filter((val) => val.length >= min);
};