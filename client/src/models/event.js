var Backbone = require('backbone')
;

module.exports = EventModel = Backbone.Model.extend({
    idAttribute: 'id',
    urlRoot: 'api/events'
});
