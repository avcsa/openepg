var Marionette = require('backbone.marionette')
;

module.exports = ServiceDetailsView = Marionette.ItemView.extend({
    template: require('../../templates/service_details.hbs'),
    className: "form-container",
    events: {
        'click a.back': 'goBack',
        'click a.submit-button': 'deleteService'
    },

    goBack: function(e) {
        e.preventDefault();
        window.App.controller.home();
    },
    deleteService: function(e) {
        e.preventDefault();

        // this will actually send a DELETE to the server:
        this.model.destroy( 
            {   
                wait: true,
                success: function() {
                    console.log("Funciono");
                    window.App.data.services.remove(this.model);
                    window.App.controller.listServices();
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'Service deleted succesfully');
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error deleting service', err.error);
                }
            });

    }
});
