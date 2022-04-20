const Timeline = require('../models/Timeline')
const { moment } = require('../helpers/time')
exports.createTimeline = (params, cb) => {
    const timeline = new Timeline(params);
    // Validate timeline
    Timeline.find({
        room: params.room
    }, (err, timelines) => {
        const overlap = _isOverlap(timeline, timelines)
        if (overlap) return cb('Timeline is overlap!')

        timeline.save().then(() => {
            return cb(null)
        }).catch(error => {
            return cb(error?.message)
        })
    })

};

const _isOverlapTimeline = (timeline1, timeline2) => {
    const range1 = moment.range(timeline1.startTime, timeline1.endTime);
    const range2 = moment.range(timeline2.startTime, timeline2.endTime);
    return range1.overlaps(range2);
}

const _isOverlap = (timeline, timelines) => {
    let ret = false
    timelines.forEach(t => {
        ret = _isOverlapTimeline(timeline, t)
    });
    return ret
}

exports.updateTimeline = (id, params, cb) => {
    Timeline.findById(id, (err, foundTimeline) => {
        if (err) return cb(err)
        if (!foundTimeline) return cb('Timeline not found!')
        const timeLine = new Timeline(params)
        Timeline.find({
            room: foundTimeline.room
        }, (err, timelines) => {
            if (err) return cb(err)
            const overlap = _isOverlap(timeLine, timelines.filter(t => t._id.toString() !== foundTimeline._id.toString()))
            if (overlap) return cb('Timeline is overlap!')

            //Update timeline
            Timeline.findByIdAndUpdate(id, params, (err) => {
                if (err) return cb(err)
                return cb(null)
            })

        })
    })
}