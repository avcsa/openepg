var models = require('../models')
,   moment = require('moment')
,   _      = require('underscore')
;

module.exports = {
    index: function(req, res) {
        models.Event.find({}, function(err, data) {
            res.json(_.map(data, module.exports.transform));
        });
    },
    getById: function(req, res) {
        models.Event.find({ eventId: req.params.id }, function(err, event) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                console.log("Econtro", event);
                res.json(event);
            }
        });
    },
    transform: function(event) {
        event.start = event.start.format("YYYY-MM-DD HH:mm:ss");
        event.startISO_8601 = event.start.substr(0, 10) + 'T' + event.start.substr(11) + ".000";
        event.duration = moment.utc(event.duration.asMilliseconds()).format('HH:mm:ss');
        return event;
    },
    add: function(req, res) {
        var event = req.body;
        if (!moment.isMoment(event.start))
            event.start = moment(event.start, moment.ISO_8601);
        if (!moment.isDuration(event.duration))
            event.duration = moment.duration(event.duration);

        models.Event.add(event, function(err, evt) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(module.exports.transform(evt));
            }
        });
    },
    update: function(req, res) {
        console.log(req.body);
        models.Event.update(req.body.id, req.body, function(err, updated) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(updated);
            }
        });
    },
    delete: function(req, res) {
        models.Event.remove(req.params.id, function(err) {
            if (err)
                res.json(400, {error: err.message});
            else
                res.json({});
        });
    }
};
