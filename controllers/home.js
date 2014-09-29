var models = require('../models')
;

module.exports = {
    index: function(req, res) {
        res.render('index');
    },
    get: function(req, res) {
        models.Server.get(function(err, server) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(server);
            }
        });
    },
    updateEit: function(req, res) {
        models.Server.updateEit(function(err, result) {
            if (err) {
                res.json(400, {error: err.message});
            } else {
                res.json(result);
            }
        });
    }
};
