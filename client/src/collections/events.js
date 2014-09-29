var Backbone     = require('backbone')
,   EventModel = require('../models/event')
;

module.exports = EventCollection = Backbone.Collection.extend({
    model:  EventModel,
    url: '/api/events'
});
