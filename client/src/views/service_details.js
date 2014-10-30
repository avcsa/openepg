var Marionette = require('backbone.marionette')
;

module.exports = ServiceDetailsView = Marionette.ItemView.extend({
    template: require('../../templates/service_details.hbs'),
    className: "form-container",
    events: {
        'click a.back': 'goBack',
        'click a.submit-button': 'enableService'
    },

    goBack: function(e) {
        e.preventDefault();
        window.App.controller.home();
    },
    enableService: function(e) {
        e.preventDefault();

        window.App.core.vent.trigger('app:showloading');
        this.model.save({}, 
            {   
                wait: true,
                success: function(model) {
                    console.log("Funciono");
                    window.App.core.vent.trigger('app:hideloading');
                    window.App.controller.listServices();
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'Service enabled/disabled succesfully');
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    window.App.core.vent.trigger('app:hideloading');
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error enabling/disabling service', err.error);
                }
            });

    }
});
