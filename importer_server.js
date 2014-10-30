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
//    status.set('status', 'error');
});
importer.on("services", function(services) {
    console.log("Received services from importer");
    epg.addServices(services);
});
importer.on("events", function(events) {
    console.log("Received events from importer");
    epg.addEvents(events);
    console.log("Updating EIT after import");
    var ret = epg.updateEit();
    if (ret) {
        console.log("EIT updated, updating Carousel");
        epg.updateCarousel();
    }        
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

