const { isSuperAdmin } = require("../helpers/user");
const RoomType = require("../models/RoomTypeModel");
const _ = require("lodash");
var mongoose = require("mongoose");
const moment = require("moment");

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

exports.roomTypeSearch = (params, cb) => {
	let checkIn = moment(Number(params.checkIn)).format('YYYY-MM-DD[T00:00:00.000Z]')
	let checkOut = moment(Number(params.checkOut)).format('YYYY-MM-DD[T00:00:00.000Z]')
	const aggregate = RoomType.aggregate()
		.match({
			$and: [
				{
					resort: {
						$in: _.flatten([params.resort]).map(id => mongoose.Types.ObjectId(id))
					}
				},
				{
					maxAdult: {
						$gte: Number(params.maxAdult)
					}
				},
				{
					status: true
				}
			]
		})
		.lookup({ from: "reservations", "localField": "_id", foreignField: "roomtype", as: "reservations" });

	aggregate.exec((error, docs) => {
		if (error) return cb(error)
		if (docs?.length) {
			docs.forEach(doc => {
				let countRoomUsed = doc?.reservations?.filter(reservation => {
					return reservation.checkIn < new Date(checkIn) && new Date(checkIn) < reservation.checkOut
				}) || []
				console.info('countRoomUsed', countRoomUsed)
				doc.capacity = doc.quantity - countRoomUsed.length
			})
		}
		return cb(error, docs)
	});
};

exports.roomTypeList = (user, cb) => {
	// let currentDate = addDays(new Date(), )
	let query = {
		status: true
	}
	if (!isSuperAdmin(user)) {
		query = {
			...query,
			resort: {
				$in: user.resort
			}
		}
	}
	const aggregate = RoomType.aggregate()
		.match(query)
		.lookup({ from: "resorts", "localField": "resort", foreignField: "_id", as: "resort" })
		.unwind({
			path: '$resort',
		})
		.lookup({
			from: "reservations",
			as: "reservations",
			let: {
				id: '$_id'
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: ['$roomtype', '$$id']
								},
								{
									$or: [
										{
											$gte: ["$checkIn", new Date()]
										},
										{
											$gte: ["$checkOut", new Date()]
										}
									]
								}
							]
						}
					}
				}
			]
		});
	aggregate.exec((error, docs) => {
		if (error) return cb(error)
		return cb(error, docs)
	})
}