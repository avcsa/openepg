var Marionette = require('backbone.marionette')
;

var itemView = Marionette.ItemView.extend({
    template: require('../../templates/event_row.hbs'),
    tagName: "tr",
    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },
    events: {
        'click': 'showDetails'
    },

    showDetails: function() {
        window.App.core.vent.trigger('app:log', 'Events View: showDetails hit.');
        window.App.controller.eventDetails(this.model.id);
    }
});

module.exports = EventsView = Marionette.CompositeView.extend({
    tagName: "table",
    template: require('../../templates/events.hbs'),
    className: "EpgTable",
    initialize: function() {
        this.listenTo(this.collection, 'change', this.render);
    },
    appendHtml: function(collectionView, itemView){
        collectionView.$("tbody").append(itemView.el);
    },
    itemView: itemView
});

