var Backbone = require('backbone')
;

module.exports = ServiceModel = Backbone.Model.extend({
    idAttribute: 'serviceId',
    urlRoot: 'api/services'
});
