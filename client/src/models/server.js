var Backbone = require('backbone')
;

module.exports = ServerModel = Backbone.Model.extend({
    idAttribute: 'id',
    urlRoot: 'server'
});
