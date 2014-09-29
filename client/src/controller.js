var Marionette         = require('backbone.marionette')
,   ServicesView       = require('./views/services')
,   ServiceDetailsView = require('./views/service_details')
,   AddServiceView     = require('./views/add_service')
,   EventsView         = require('./views/events')
,   EventDetailsView   = require('./views/event_details')
,   AddEventView       = require('./views/add_event')
,   HomeView           = require('./views/home')
;

module.exports = Controller = Marionette.Controller.extend({
    initialize: function() {
        App.core.vent.trigger('app:log', 'Controller: Initializing');
        window.App.views.servicesView = new ServicesView({ collection: window.App.data.services });
        window.App.views.eventsView = new EventsView({ collection: window.App.data.events });
    },

    home: function() {
        App.core.vent.trigger('app:log', 'Controller: "Home" route hit.');
        var view = new HomeView({model: window.App.data.server});
        this.renderView(view);
        window.App.router.navigate('#');
    },

    listServices: function() {
        App.core.vent.trigger('app:log', 'Controller: "List Services" route hit.');
        var view = window.App.views.servicesView;
        this.renderView(view);
        window.App.router.navigate('#listServices');
    },

    serviceDetails: function(id) {
        App.core.vent.trigger('app:log', 'Controller: "Service Details" route hit.');
        var view = new ServiceDetailsView({ model: window.App.data.services.get(id)});
        this.renderView(view);
        window.App.router.navigate('serviceDetails/' + id);
    },

    addService: function() {
        App.core.vent.trigger('app:log', 'Controller: "Add Service" route hit.');
        var view = new AddServiceView();
        this.renderView(view);
        window.App.router.navigate('addService');
    },

    listEvents: function() {
        App.core.vent.trigger('app:log', 'Controller: "List Events" route hit.');
        var view = window.App.views.eventsView;
        this.renderView(view);
        window.App.router.navigate('#listEvents');
    },
    
    eventDetails : function(id) {
        App.core.vent.trigger('app:log', 'Controller: "Event Details" route hit.');
        var view = new EventDetailsView({ model: window.App.data.events.get(id)});
        this.renderView(view);
        window.App.router.navigate('eventDetails/' + id);
    },
    addEvent: function() {
        App.core.vent.trigger('app:log', 'Controller: "Add Event" route hit.');
        var view = new AddEventView({ collection: window.App.data.services});
        this.renderView(view);
        window.App.router.navigate('addEvent');
    },

    renderView: function(view) {
        this.destroyCurrentView(view);
        App.core.vent.trigger('app:log', 'Controller: Rendering new view.');
        $('#js-epg-app').html(view.render().el);
    },

    destroyCurrentView: function(view) {
        if (!_.isUndefined(window.App.views.currentView)) {
            App.core.vent.trigger('app:log', 'Controller: Destroying existing view.');
            window.App.views.currentView.close();
        }
        window.App.views.currentView = view;
    }
});
