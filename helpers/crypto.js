const { omitNullishObject } = require("./utility");
const querystring = require("qs");
const crypto = require("crypto");
/**
 * Sign object with secretKey
 * @param {*} value 
 * @returns 
 */
exports.sign = (value = {}) => {
    var secretKey = process.env.VNP_HASHSECRET;
    let params = omitNullishObject(value);
    // params = sortObject(params);
    var signData = querystring.stringify(params, { encode: false });
    var hmac = crypto.createHmac("sha512", secretKey);
    var signed = hmac.update(signData).digest("hex");
    return signed;
}