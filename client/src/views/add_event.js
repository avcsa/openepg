var Marionette = require('backbone.marionette')
;

var ServicesView = Backbone.Marionette.ItemView.extend({
    template: require('../../templates/service_item.hbs'),
    tagName: "option",
    onRender: function(){
        this.$el.attr('value', this.model.get('serviceId'));
    }
});

module.exports = AddView = Marionette.CompositeView.extend({
    template: require('../../templates/add_event.hbs'),
    className: "form-container",
    itemViewContainer: "select",
    itemView: ServicesView,
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
        this.$el.find('#serviceId').keydown(validate);
    },
    events: {
        'click a.submit-button': 'save'
    },

    save: function(e) {
        e.preventDefault();
        var newEvent = {
            start    : this.$el.find('#start').val(),
            duration : this.$el.find('#duration').val(),
            serviceId: parseInt(this.$el.find('#service').val()),
            title    : this.$el.find('#title').val(),
            synopsis : this.$el.find('#synopsis').val()
        };

        window.App.data.events.create(newEvent, 
            {   
                wait: true,
                success: function() {
                    console.log("Funciono");
                    window.App.core.vent.trigger('app:showmessage', 'success', 'Success', 'Event created succesfully');
                    window.App.core.vent.trigger('app:log', 'Add View: Saved new event!');
                    window.App.controller.listEvents();
                },
                error: function(model, xhr) {
                    var err = JSON.parse(xhr.responseText);
                    console.log("Fallo:", err.error);
                    
                    window.App.core.vent.trigger('app:showmessage', 'error', 'Error creating event', err.error);
                }
            });
    }
});
