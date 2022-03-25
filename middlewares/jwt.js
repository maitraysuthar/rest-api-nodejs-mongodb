const jwt = require("jsonwebtoken");
const RefreshToken = require("../models/RefreshTokenModel");
const User = require("../models/UserModel");
/**
 * Verify session is logout
 * @param {*} req 
 * @param {*} payload 
 * @param {*} done 
 */
function isRevoked(req, payload, done) {
	RefreshToken.findOne({ user: payload._id }).then((foundRefreshToken) => {
		if (!foundRefreshToken) {
			return done(true);
		}
		return done(false);
	}, ((err) => {
		return done(err);
	}));
}
/**
 * Verify session is blocked because super admin block user
 * @param {*} req 
 * @param {*} payload 
 * @param {*} done 
 */
function isBlocked(req, payload, done) {
	User.findById(payload._id).then(user => {
		if (!user || !user.status) {
			return done(true);
		}
		return done(false);
	}, (err) => {
		return done(err);
	});
}

function authenticateToken(req, res, next) {
	const authHeader = req.headers["authorization"];
	const token = authHeader && authHeader.split(" ")[1];

	if (token == null) return res.sendStatus(401);

	jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {

		if (err) return res.sendStatus(403);

		req.user = user;

		isRevoked(req, user, (error) => {
			if (error) return res.sendStatus(403);
			isBlocked(req, user, (error) => {
				if (error) return res.sendStatus(403);
				next();
			});
		});
	});
}

module.exports = authenticateToken;

