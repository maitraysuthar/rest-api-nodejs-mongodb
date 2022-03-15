const jwt = require("express-jwt");

const RefreshToken = require("../models/RefreshTokenModel");

const secret = process.env.JWT_SECRET;

const authenticate = jwt({
	secret: secret,
	// isRevoked: (req, payload, done) => {
	// 	RefreshToken.findOne({ user: payload._id }).then((foundRefreshToken) => {
	// 		if (!foundRefreshToken) {
	// 			return done(null, true);
	// 		}
	// 		return done(null, false);
	// 	}, ((err) => {
	// 		return done(err);
	// 	}));
	// }
});

module.exports = authenticate;

