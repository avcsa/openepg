var Marionette = require('backbone.marionette')
;

var itemView = Marionette.ItemView.extend({
    template: require('../../templates/service_row.hbs'),
    tagName: "tr",
    initialize: function() {
        this.listenTo(this.model, 'change', this.render);
    },
    events: {
        'click': 'showDetails'
    },

    showDetails: function() {
        window.App.core.vent.trigger('app:log', 'Services View: showDetails hit.');
        window.App.controller.serviceDetails(this.model.id);
    }
});

module.exports = ServicesView = Marionette.CompositeView.extend({
    tagName: "table",
    template: require('../../templates/services.hbs'),
    className: "EpgTable",
    initialize: function() {
        this.listenTo(this.collection, 'change', this.render);
    },
    appendHtml: function(collectionView, itemView){
        collectionView.$("tbody").append(itemView.el);
    },
    itemView: itemView
});

