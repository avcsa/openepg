var Marionette = require('backbone.marionette')
;

module.exports = HomeView = Marionette.ItemView.extend({
    template: require('../../templates/home.hbs'),
    className: "form-container",
    initialize: function() {
        this.model.fetch();
    },
    events: {
        'click a.back': 'goBack',
        'click a.submit-button': 'updateEit'
    },

    goBack: function(e) {
        e.preventDefault();
        window.App.controller.home();
    },
    updateEit: function(e) {
        e.preventDefault();
        this.model.save({}, 
            {   
                success: function(model) {
                    window.App.data.server = model;
                    window.App.controller.home();
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'EIT updated succesfully');
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error updating EIT', err.error);
                }
            });

    }
});