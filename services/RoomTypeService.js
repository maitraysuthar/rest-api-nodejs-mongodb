const { isSuperAdmin } = require("../helpers/user");
const RoomType = require("../models/RoomTypeModel");
const _ = require("lodash");

exports.findByUser = (user, cb) => {
	const { resort } = user;
	let query = {};
	if (!isSuperAdmin(user)) {
		query = {
			resort: {
				$in: resort
			}
		};
	}
	RoomType.find(query, cb);
};

exports.searchRoom = (params, cb) => {
	let query = {
		resort: {
			$in: _.flatten([params.resort])
		},
		maxAdult: {
			$gte: Number(params.maxAdult)
		},
		status: true
	};
	RoomType.find(query, cb);
};