var Marionette = require('backbone.marionette')
;

module.exports = Router = Marionette.AppRouter.extend({
    appRoutes: {
        ''  : 'home',
        'listServices' : 'listServices',
        'serviceDetails/:id' : 'serviceDetails',
        'addService' : 'addService',
        'listEvents' : 'listEvents',
        'eventDetails/:id' : 'eventDetails',
        'addEvent' : 'addEvent'
    }
});
