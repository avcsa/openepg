var Epg  = require('./lib/epg')
,   conf = require('./conf')
,   epg  = new Epg(conf)
,   _    = require('underscore')
,   moment = require('moment')
;

var Service = {
    "find": function(filter, callback) {
        try {
            var data = epg.listServices();
            if (filter) {
                if (filter.serviceId)
                    data = _.find(data, function(service) {return service.serviceId === parseInt(filter.serviceId);});
            }
            if (data.length === 0)
                callback(new Error('No services found'));
            else
                callback(undefined, data);
        } catch(e) {
            console.error("Error finding services", e.message);
            callback(e);
        }
    }, 
    "add": function(service, callback) {
        try {
            var services = epg.listServices();
            if (services.length === 0)
                service.serviceId = 1;
            else
                service.serviceId = _.max(services, function(serv) {return serv.serviceId;}).serviceId + 1;

            epg.addService(service);

            callback(undefined, service);
        } catch(e) {
            console.error("Error adding service", e.message);
            callback(e);
        }
    },
    "update": function(serviceId, service, callback) {
//        try {
//            service.serviceId = uuid.v1();
//            epg.addService(service);
//            callback(undefined, service);
//        } catch(e) {
//            callback(e);
//        }
        callback(new Error("UPDATE NOT IMPLEMENTED"));
    },
    "remove": function(signalId, callback) {
        try {
            var cant = epg.deleteServices({signalId: signalId});
            if (cant === 0)
                callback(new Error('No service deleted'));
            else
                callback();
        } catch(e) {
            console.error("Error removing service", e.message);
            callback(e);
        }
    }
};

var Event = {
    "find": function(filter, callback) {
        try {
            if (!filter)
                filter = {};

            var data = [];
            if (!filter.serviceId) {
                var services = epg.listServices();
                _.each(services, function(service) {
                    filter.serviceId = service.serviceId;
                    var events = epg.listEvents(filter);
                    data = _.union(events, data);
                });
            } else {
                data = epg.listEvents(filter);
            }
            data = _.map(data, Event.addService);
            if (data.length === 0)
                callback(new Error('No events found'));
            else
                callback(undefined, data);
        } catch(e) {
            console.error("Error finding events", e.message);
            callback(e);
        }
    }, 
    "addService": function(event) {
        event.service = _.find(epg.listServices(), function(service) {
            return (service.serviceId === event.serviceId);
        });
        return event;
    },
    "add": function(event, callback) {
        try {
            event = epg.addEvent(event);
            callback(undefined, Event.addService(event));
        } catch(e) {
            console.error("Error adding event", e.message);
            callback(e);
        }
    },
    "update": function(serviceId, service, callback) {
//        try {
//            service.serviceId = uuid.v1();
//            epg.addService(service);
//            callback(undefined, service);
//        } catch(e) {
//            callback(e);
//        }
        callback(new Error("UPDATE NOT IMPLEMENTED"));
    },
    "remove": function(eventId, callback) {
        try {
            var cant = epg.deleteEvents({eventId: eventId});
            if (cant === 0)
                callback(new Error('No event deleted'));
            else
                callback();
        } catch(e) {
            console.error("Error removing event", e.message);
            callback(e);
        }
    }
};

var Server = {
    lastEitUpdated : undefined,
    lastCarsouselUpdated: undefined,
    lastUpdateAttempt: undefined, 
    serverStarted: undefined,
    updateEit: function(callback) {
        if (!this.serverStarted)
            this.serverStarted = moment().format("YYYY-MM-DD HH:mm:ss");
        try {
            this.lastUpdateAttempt = moment().format("YYYY-MM-DD HH:mm:ss");
            var ret = epg.updateEit();
            if (ret) {
                this.lastEitUpdated = moment().format("YYYY-MM-DD HH:mm:ss");
                epg.updateCarousel();
                this.lastCarouselUpdated = moment().format("YYYY-MM-DD HH:mm:ss");
            }
            var server = {
                id: 1,
                lastEitUpdated : this.lastEitUpdated,
                lastCarouselUpdated: this.lastCarouselUpdated,
                lastUpdateAttempt: this.lastUpdateAttempt, 
                serverStarted: this.serverStarted
            };        
            callback(undefined, server);
        } catch(e) {
            console.log("Error updating eit and carousel", e);
            callback(e, false);
        }
    },
    get: function(callback) {
        var server = {
            id: 1,
            lastEitUpdated : this.lastEitUpdated,
            lastCarouselUpdated: this.lastCarouselUpdated,
            lastUpdateAttempt: this.lastUpdateAttempt, 
            serverStarted: this.serverStarted
        };
        callback(undefined, server);
    }
};
module.exports = {
    Service: Service,
    Event: Event,
    Server: Server
};
