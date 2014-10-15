var _        = require('underscore')
,   Epg      = require('./lib/epg')
,   conf     = require('./conf')
,   epg      = new Epg(conf.epg)
,   importer = require('./importer/' + conf.importer.type)(conf.importer.options)
,   status   = require('./status_client')('importer')
,   moment   = require('moment')
;

importer.on("error", function(err) {
    console.error("Error importing data", err);
    status.set('status', 'error');
});
importer.on("services", function(services) {
    console.log("Received services from importer");
    _.each(services, function(service) {
        try {
            var serv = epg.listServices();
            if (serv)
                serv = _.find(serv, function(s) {return s.serviceId === parseInt(service.serviceId);});
            
            if (!serv) {
                console.log("Creating service", service);
                serv = {};
                serv.serviceId = service.serviceId;
                if (service.originalNetworkId)
                    serv.originalNetworkId = service.originalNetworkId;
                else
                    serv.originalNetworkId = service.serviceId;
                if (service.transportStreamId)
                    serv.transportStreamId = service.transportStreamId;
                else
                    serv.transportStreamId = service.serviceId;
                if (service.comment)
                    serv.comment = service.comment;
                else
                    serv.comment = 'Service ' + service.serviceId;
                if (service.signalId)
                    serv.signalId = service.signalId;
                else
                    serv.signalId = service.serviceId;
            } else {
                console.log("Updating service", service);
                if (service.originalNetworkId)
                    serv.originalNetworkId = service.originalNetworkId;
                if (service.transportStreamId)
                    serv.transportStreamId = service.transportStreamId;
                if (service.comment)
                    serv.comment = service.comment;
                if (service.signalId)
                    serv.signalId = service.signalId;
            }
            epg.addService(serv);
            console.log("Service added/updated");
            var cant = epg.deleteEvents({serviceId: serv.serviceId});
            console.log(cant + " events removed from service", serv.serviceId);
        } catch (err) {
            console.error("Error adding/updating service", err, service);
        }
    });
});
importer.on("events", function(events) {
    console.log("Received events from importer");
    var updateEit = _.after(events.length, function() {
        console.log("Updating EIT after import");
        var ret = epg.updateEit();
        if (ret) {
            console.log("EIT updated, updating Carousel");
            epg.updateCarousel();
        }    
    });
    var eventId = epg.getMaxEventId();
    _.each(events, function(event) {
        eventId++;
        event.id = eventId;
        console.log("Adding event", event.title);
        try {
            var evt = epg.addEvent(event);
            console.log("Event added");
            updateEit();
        } catch (err) {
            console.error("Error adding event", err, event);
        }
    });
});
importer.on("run", function() {
    console.log("Starting import");
    status.set('status', 'running');
});
importer.on("done", function() {
    console.log("Import finished");
    status.set('status', 'idle');
    status.set('lastRun', moment().toISOString());
    status.set('nextRun', moment().add(importer.options.interval_hours, 'hours').toISOString());
});

status.set('status', 'running', function() {
    console.log("Starting importer");
    importer.run();
});

