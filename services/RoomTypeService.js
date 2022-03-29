const { isSuperAdmin } = require("../helpers/user");
const RoomType = require("../models/RoomTypeModel");
const _ = require("lodash");
var mongoose = require("mongoose");
const Moment = require("moment");

const MomentRange = require("moment-range");

const moment = MomentRange.extendMoment(Moment);

const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");
const { min } = require("lodash");

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
									$eq: ['$status', 1]
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
										{
											$and: [
												{
													$gt: [checkOut, "$checkOut"]
												},
												{
													$lt: [checkIn, "$checkIn"]
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
				const reservations = doc?.reservations || []

				const listAvai = []
				reservations.reduce((ret, reservation, index) => {
					if (index == 0) {
						listAvai.push(doc.quantity - reservation.amount)
						return doc.quantity - reservation.amount
					}
					const preRange = moment.range(reservations[index - 1].checkIn, reservations[index - 1].checkOut)
					const range = moment.range(reservation.checkIn, reservation.checkOut)
					if (preRange.overlaps(range)) {
						listAvai.push(ret - reservation.amount)
						return ret - reservation.amount
					} else {
						listAvai.push(ret + reservations[index - 1].amount - reservation.amount)
						return ret + reservations[index - 1].amount - reservation.amount
					}
				}, doc.quantity)
				doc.capacity = min([...listAvai, doc.quantity])
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
									$eq: ['$roomtype', '$$id'],
								},
								{
									$eq: ['$status', 1]
								}
							]
						}
					}
				}
			]
		});
	aggregate.exec((error, docs) => {
		if (error) return cb(error)
		docs.forEach(doc => {
			let reservations = doc?.reservations || []
			reservations = reservations.filter((reservation) => {
				let checkIn = moment(reservation.checkIn)
				let checkOut = moment(reservation.checkOut)

				if (checkIn.isBefore(moment.now()) || checkOut.isAfter(moment.now())) {
					return true
				}
			})

			const listAvai = []
			reservations.reduce((ret, reservation, index) => {
				if (index == 0) {
					listAvai.push(doc.quantity - reservation.amount)
					return doc.quantity - reservation.amount
				}
				const preRange = moment.range(reservations[index - 1].checkIn, reservations[index - 1].checkOut)
				const range = moment.range(reservation.checkIn, reservation.checkOut)
				if (preRange.overlaps(range)) {
					listAvai.push(ret - reservation.amount)
					return ret - reservation.amount
				} else {
					listAvai.push(ret + reservations[index - 1].amount - reservation.amount)
					return ret + reservations[index - 1].amount - reservation.amount
				}
			}, doc.quantity)
			doc.capacity = min([...listAvai, doc.quantity])

		})
		return cb(error, docs)
	})
}

/**
 * Fetch detail room 
 * @param {Object} params 
 * @params
 * - roomtype(mongoose.Types.ObjectId)
 * - checkIn (ISO DATE)
 * - checkOut (ISO DATE)
 * @param {Function} cb 
 * - cb(error,room)
 */
exports.roomTypeDetail = (params, cb) => {
	const checkIn = params.checkIn
	const checkOut = params.checkOut
	const aggregate = RoomType.aggregate()
		.match({
			_id: mongoose.Types.ObjectId(params.roomtype)
		})
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
									$eq: ['$status', 1]
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
										{
											$and: [
												{
													$gt: [checkOut, "$checkOut"]
												},
												{
													$lt: [checkIn, "$checkIn"]
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
		})
	aggregate.exec((error, docs) => {
		if (error) return cb(error)
		if (docs) {
			docs.forEach(doc => {
				const reservations = doc?.reservations || []

				const listAvai = []
				reservations.reduce((ret, reservation, index) => {
					if (index == 0) {
						listAvai.push(doc.quantity - reservation.amount)
						return doc.quantity - reservation.amount
					}
					const preRange = moment.range(reservations[index - 1].checkIn, reservations[index - 1].checkOut)
					const range = moment.range(reservation.checkIn, reservation.checkOut)
					if (preRange.overlaps(range)) {
						listAvai.push(ret - reservation.amount)
						return ret - reservation.amount
					} else {
						listAvai.push(ret + reservations[index - 1].amount - reservation.amount)
						return ret + reservations[index - 1].amount - reservation.amount
					}
				}, doc.quantity)
				doc.capacity = min([...listAvai, doc.quantity])
			})
			return cb(error, docs[0])
		}
		return cb(error, docs)
	})
}