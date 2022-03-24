const { isSuperAdmin } = require("../helpers/user");
const RoomType = require("../models/RoomTypeModel");
const _ = require("lodash");
var mongoose = require("mongoose");
const moment = require("moment");
const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");

/**
 * Find room match with resort, checkIn, checkOut, maxAdult and available number of room
 * @param {*} params 
 * @param {*} cb 
 */
exports.roomTypeSearch = (params, cb) => {
	let checkIn = getCheckInTimeToDate(params.checkIn)
	let checkOut = getCheckOutTimeToDate(params.checkOut)
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
											$and: [
												{
													$gt: [checkIn, "$checkIn"]
												},
												{
													$lt: [checkIn, "$checkOut"]
												},
											]
										},
										{
											$and: [
												{
													$gt: [checkOut, "$checkIn"]
												},
												{
													$lt: [checkOut, "$checkOut"]
												},
											]
										},
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
		if (docs?.length) {
			docs.forEach(doc => {
				const amountRoom = doc?.reservations?.reduce((r, n) => r + n.amount, 0) || 0
				doc.capacity = doc.quantity - amountRoom
			})
		}
		return cb(error, docs)
	});
};
/**
 * Find room by user
 * @param {*} user 
 * @param {*} cb 
 */
exports.roomTypeList = (user, cb) => {
	// let currentDate = addDays(new Date(), )
	let query = {
		status: true
	}
	if (!isSuperAdmin(user)) {
		query = {
			...query,
			resort: {
				$in: user.resort.map(id => new mongoose.Types.ObjectId(id))
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