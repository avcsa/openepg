var Marionette         = require('backbone.marionette')
,   Controller         = require('./controller')
,   Router             = require('./router')
,   ServiceModel       = require('./models/service')
,   ServicesCollection = require('./collections/services')
,   EventModel         = require('./models/event')
,   EventsCollection   = require('./collections/events')
,   ServerModel        = require('./models/server')
;

module.exports = App = function App() {};

App.prototype.start = function(){
    App.core = new Marionette.Application();

    App.core.on("initialize:before", function (options) {
        App.core.vent.trigger('app:log', 'App: Initializing');

        App.views = {};
        App.data = {};

        App.data.messages = ['info','warning','error','success'];
        
        App.core.vent.trigger('app:initmessages');

        // load up some initial data:
        var services = new ServicesCollection();
        services.fetch().always(function() { 
            App.core.vent.trigger('app:log', 'App: Setting services');
            App.data.services = services;
        });
        var events = new EventsCollection();
        events.fetch().always(function() { 
            App.core.vent.trigger('app:log', 'App: Setting events');
            App.data.events = events;
        });
        var server = new ServerModel({id: 1});
        server.fetch().always(function() { 
            App.core.vent.trigger('app:log', 'App: Setting server');
            App.data.server = server;
            App.core.vent.trigger('app:start'); 
        });
        
    });

    App.core.vent.bind('app:start', function(options){
        App.core.vent.trigger('app:log', 'App: Starting');
        if (Backbone.history) {
            App.controller = new Controller();
            App.router = new Router({ controller: App.controller });
            App.core.vent.trigger('app:log', 'App: Backbone.history starting');
            Backbone.history.start();
        }

        App.core.vent.trigger('app:hideloading');

        //new up and views and render for base app here...
        App.core.vent.trigger('app:log', 'App: Done starting and running!');
    });

    App.core.vent.bind('app:log', function(msg) {
        console.log(msg);
    });
    
    App.core.vent.bind('app:initmessages', function() {
        App.core.vent.trigger('app:log', 'App: Init messages!');
        
        $('.message').click(function(){              
            $(this).animate({top: -$(this).outerHeight()}, 500);
        }); 
        App.core.vent.trigger('app:hidemessages');
    });
    
    App.core.vent.bind('app:hidemessages', function() {
        App.core.vent.trigger('app:log', 'App: Hiding all messages!');
        var messagesHeights = [];
     
        for (var i = 0; i < App.data.messages.length; i++) {
            messagesHeights[i] = $('.' + App.data.messages[i]).outerHeight();
            $('.' + App.data.messages[i]).css('top', -messagesHeights[i]);
        } 
    });
    
    App.core.vent.bind('app:hideloading', function() {
        App.core.vent.trigger('app:log', 'App: Hiding loading gif');
        $('#loading').hide();
    });
    
    App.core.vent.bind('app:showloading', function() {
        App.core.vent.trigger('app:log', 'App: Showing loading gif');
        $('#loading').show();
    });
    
    App.core.vent.bind('app:showmessage', function(type, title, message) {
        App.core.vent.trigger('app:log', 'App: Showing ' + type + ' message');
        App.core.vent.trigger('app:hidemessages');
        $('.'+type + ' > h3').text(title);
        $('.'+type + ' > p').text(message);
        $('.'+type).animate({top:"0"}, 500);
        if (type !== 'error')
            setTimeout(function() {
                var height =  $('.'+type).outerHeight();
                $('.'+type).animate({top: -height}, 500);
            }, 3000);
    });

    App.core.start();
};
