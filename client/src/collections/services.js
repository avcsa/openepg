var Backbone     = require('backbone')
,   ServiceModel = require('../models/service')
;

module.exports = ServiceCollection = Backbone.Collection.extend({
    model:  ServiceModel,
    url: '/api/services',
    comparator: function(col) {
        return (col.get('comment'));
    }
});
