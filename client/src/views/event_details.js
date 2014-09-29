var Marionette = require('backbone.marionette')
;

module.exports = EventDetailsView = Marionette.ItemView.extend({
    template: require('../../templates/event_details.hbs'),
    className: "form-container",
    events: {
        'click a.back': 'goBack',
        'click a.submit-button': 'deleteEvent'
    },

    goBack: function(e) {
        e.preventDefault();
        window.App.controller.home();
    },
    deleteEvent: function(e) {
        e.preventDefault();
        

        // this will actually send a DELETE to the server:
        this.model.destroy( 
            {   
                success: function() {
                    console.log("Funciono");
                    window.App.data.events.remove(this.model);
                    window.App.controller.listEvents();
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'Event deleted succesfully');
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error deleting event', err.error);
                }
            });

    }
});
