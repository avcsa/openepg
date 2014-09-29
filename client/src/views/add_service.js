var Marionette = require('backbone.marionette')
;

module.exports = AddView = Marionette.ItemView.extend({
    template: require('../../templates/add_service.hbs'),
    className: "form-container",
    onRender: function() {
        var validate = function (e) {
            // Allow: backspace, delete, tab, escape, enter and .
            if ($.inArray(e.keyCode, [46, 8, 9, 27, 13/*, 110, 190*/]) !== -1 ||
                 // Allow: Ctrl+A
                (e.keyCode === 65 && e.ctrlKey === true) || 
                 // Allow: home, end, left, right
                (e.keyCode >= 35 && e.keyCode <= 39)) {
                     // let it happen, don't do anything
                     return;
            }
            // Ensure that it is a number and stop the keypress
            if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
                e.preventDefault();
            }
        };        
//        this.$el.find('#pid').keydown(validate);
        this.$el.find('#signalId').keydown(validate);
        this.$el.find('#originalNetworkId').keydown(validate);
        this.$el.find('#transportStreamId').keydown(validate);
    },
    events: {
        'click a.submit-button': 'save'
    },

    save: function(e) {
        e.preventDefault();
        var newService = {
//            pid              : parseInt(this.$el.find('#pid').val()),
            signalId         : parseInt(this.$el.find('#signalId').val()),
            originalNetworkId: parseInt(this.$el.find('#originalNetworkId').val()),
            transportStreamId: parseInt(this.$el.find('#transportStreamId').val()),
            comment          : this.$el.find('#comment').val()
        };

        window.App.data.services.create(newService, 
            {   
                wait: true,
                success: function() {
                    console.log("Funciono");
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'Service created succesfully');
                    window.App.core.vent.trigger('app:log', 'Add View: Saved new service!');
                    window.App.controller.listServices();
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error creating service', err.error);
                }
            });
    }
});
