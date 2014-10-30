var models = require('../models');

module.exports = {
    index: function(req, res) {
        models.Service.find({}, function(err, data) {
            res.json(data);
        });
    },
    getById: function(req, res) {
        models.Service.find({ serviceId: req.params.id }, function(err, service) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(service);
            }
        });
    },
    add: function(req, res) {
        models.Service.add(req.body, function(err, service) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(service);
            }
        });
    },
    update: function(req, res) {
        console.log(req.body);
        models.Service.update(req.body.id, req.body, function(err, updated) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(updated);
            }
        });
    },
    enable: function(req, res) {
        models.Service.enable(req.params.id, function(err1, result) {
            if (err1)
                res.json(400, {error: err1.message});
            else
                res.json(result);
        });
    }
};
