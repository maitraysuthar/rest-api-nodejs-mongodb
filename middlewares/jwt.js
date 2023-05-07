const jwt = require("express-jwt");
const secret = process.env.JWT_SECRET;

const authenticate = jwt({
	secret: secret,
	credentialsRequired: false,
	algorithms: ['HS256']
});

module.exports = authenticate;