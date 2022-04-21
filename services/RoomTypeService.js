const { isSuperAdmin } = require("../helpers/user");
const RoomType = require("../models/RoomTypeModel");
const _ = require("lodash");
var mongoose = require("mongoose");
const Moment = require("moment");
const { min, max } = require("lodash");
const MomentRange = require("moment-range");


const { getCheckInTimeToDate, getCheckOutTimeToDate } = require("../helpers/time");
const { RESERVATION_STATUS } = require('../constants/index')
const { generateCombinations } = require("../helpers/utility");

const moment = MomentRange.extendMoment(Moment);

/**
 * calculatate number of room available
 * @param {*} reservations 
 * @param {*} quantity 
 * @returns number of room available
 */
const _calculateCapacity = (reservations = [], doc, checkIn, checkOut) => {
	let start = moment(checkIn).startOf('days')
	let end = moment(checkOut).endOf('days')

	let timelines = doc.timelines.map(timeline => ({ ...timeline, range: moment.range(timeline.startTime, timeline.endTime) }))
	reservations = reservations.map(r => ({ ...r, range: moment.range(moment(r.checkIn).startOf('days'), moment(r.checkOut).startOf('days')) }))

	let availables = []

	let basicOccupys = []

	let timelineOccupys = []

	while (start.isBefore(end)) {
		const timelineFounded = timelines.find(t => t.range.contains(start))
		const reservationsFounded = reservations.find(r => r.range.contains(start))

		let isSameCheckout = reservationsFounded && moment(start).set({ "hour": 12, "minute": 0, "second": 0, "millisecond": 0 }).isSame(reservationsFounded.checkOut)
		let roomBooked = reservationsFounded?.rooms?.find(r => r.roomId.toString() == doc._id.toString())
		let roomOccupy = roomBooked && !isSameCheckout ? roomBooked.amount : 0
		let available = timelineFounded ? timelineFounded.paymentRoom - roomOccupy : doc.paymentRoom - roomOccupy

		let basicOccupy = timelineFounded ? 0 : roomOccupy
		basicOccupys.push(basicOccupy)

		let timelineOccupy = timelineFounded ? roomOccupy : 0
		timelineOccupys.push(timelineOccupy)

		availables.push(available)

		start = start.add(1, 'days')
	}
	return {
		available: min(availables),
		basicOccupy: max(basicOccupys),
		timelineOccupy: max(timelineOccupys)
	}
}

exports.getRoomTypeSuggestion = (params, cb) => {
	let checkIn = getCheckInTimeToDate(params.checkIn)
	let checkOut = getCheckOutTimeToDate(params.checkOut)

	let adult = Number(params.adult)
	let children = Number(params.children)
	let amount = Number(params.amount)

	const aggregate = RoomType.aggregate()
		.match({
			$and: [
				{
					resort: {
						$in: _.flatten([params.resort]).map(id => mongoose.Types.ObjectId(id))
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
									$in: [
										'$$id',
										"$rooms.roomId",
									]
								},
								{
									$in: ['$status', [RESERVATION_STATUS.PENDING_COMPLETED, RESERVATION_STATUS.PENDING_CANCELED]]
								},
								{
									$or: [
										{
											$and: [
												{
													$gte: [checkIn, "$checkIn"]
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
													$lte: [checkOut, "$checkOut"]
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
		.lookup({
			from: "timelines",
			as: "timelines",
			let: {
				id: '$_id'
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: [
										'$$id',
										"$room",
									]
								},
							]
						}
					}
				}
			]
		})

	aggregate.exec((error, rooms) => {
		if (error) return cb(error)
		// Cal number of room available
		rooms.forEach(doc => {
			const reservations = doc?.reservations || []

			doc.capacity = _calculateCapacity(reservations, doc, checkIn, checkOut).available
		})

		const combinations = generateCombinations(rooms, amount, amount)
		// Filter combind available room
		const combinationsAvailable = combinations.filter(comb => {
			const group = _.groupBy(comb, '_id')
			for (const key in group) {
				const numberOfRoom = group[key].length
				if (group[key][0].capacity <= numberOfRoom) {
					return false
				}
			}
			return true
		})
		// Filter combind valid with adult, children
		const combindSuggest = combinationsAvailable.filter(rooms => {
			return _validatePeople(rooms, adult, children)
		})
		// Find combind cheapest
		let bestSuggest = _.minBy(combindSuggest, (rr) => {
			const price = rr.reduce((ret, r) => {
				return ret + r.price - r.sale * r.price / 100
			}, 0)
			return price
		})
		// Format room with amount
		let ret = Object.values(_.groupBy(bestSuggest, '_id'))
		ret = ret.map(room => ({
			...room[0],
			amount: room.length
		}))
		return cb(error, ret)
	});
}
/**
 * Verify reservation match valid with adult,children
 * @param {*} rooms 
 * @param {*} adult 
 * @param {*} children 
 * @returns 
 */
const _validatePeople = (rooms = [], adult = 1, children = 0) => {
	const { maxAdult, maxChildren } = rooms.reduce((ret, room) => {
		return {
			maxAdult: ret.maxAdult + room.maxAdult,
			maxChildren: ret.maxChildren + room.maxChildren
		}
	}, { maxAdult: 0, maxChildren: 0 })
	if (maxAdult >= adult && maxChildren >= children) return true
	if (maxChildren < children && maxAdult - adult >= children - maxChildren) return true
	return false
}
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
									$in: [
										'$$id',
										"$rooms.roomId",
									]
								},
								{
									$in: ['$status', [RESERVATION_STATUS.PENDING_COMPLETED, RESERVATION_STATUS.PENDING_CANCELED]]
								},
								{
									$or: [
										{
											$and: [
												{
													$gte: [checkIn, "$checkIn"]
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
													$lte: [checkOut, "$checkOut"]
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
		}).lookup({
			from: "timelines",
			as: "timelines",
			let: {
				id: '$_id'
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: [
										'$$id',
										"$room",
									]
								},
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

				doc.capacity = _calculateCapacity(reservations, doc, checkIn, checkOut).available
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
	let query = {}
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
									$in: [
										'$$id',
										"$rooms.roomId",
									]
								},
								{
									$in: ['$status', [RESERVATION_STATUS.PENDING_COMPLETED, RESERVATION_STATUS.PENDING_CANCELED]]
								}
							]
						}
					}
				}
			]
		})
		.lookup({
			from: "timelines",
			as: "timelines",
			let: {
				id: '$_id'
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: [
										'$$id',
										"$room",
									]
								},
							]
						}
					}
				}
			]
		})
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

			let maxCheckOut = moment.max(_.flatten(reservations.map(r => [moment(r.checkIn), moment(r.checkOut)])))

			let { available, basicOccupy, timelineOccupy } = _calculateCapacity(reservations, doc, moment(), maxCheckOut)

			doc.capacity = reservations?.length ? available : 0
			doc.basicOccupy = reservations?.length ? basicOccupy : 0
			doc.timelineOccupy = reservations?.length ? timelineOccupy : 0


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
									$in: [
										'$$id',
										"$rooms.roomId",
									]
								},
								{
									$in: ['$status', [RESERVATION_STATUS.PENDING_COMPLETED, RESERVATION_STATUS.PENDING_CANCELED]]
								},
								{
									$or: [
										{
											$and: [
												{
													$gte: [checkIn, "$checkIn"]
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
													$lte: [checkOut, "$checkOut"]
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
		}).lookup({
			from: "timelines",
			as: "timelines",
			let: {
				id: '$_id'
			},
			pipeline: [
				{
					$match: {
						$expr: {
							$and: [
								{
									$eq: [
										'$$id',
										"$room",
									]
								},
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

				doc.capacity = _calculateCapacity(reservations, doc, checkIn, checkOut).available
			})
			return cb(error, docs[0])
		}
		return cb(error, docs)
	})
}