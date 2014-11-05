var conf     = require('./conf')
,   epg      = require('./lib/epg')(conf.epg)
,   moment   = require('moment')
,   status   = require("./status_client")('eitUpdate')
;

var interval = conf.eit_updater.interval_hours * (60 * 60 * 1000);
var retry_interval = conf.eit_updater.retry_interval_minutes * (60 * 1000);

var update = function() {
    status.getStatus(function(st) {
        if (st.importer.status === 'running') {
            console.log("Importer running...");
            if (retry_interval) {
                console.log("Retrying in", retry_interval);
                status.set('status', 'waiting lock');
                setTimeout(update, retry_interval);
            } else {
                console.log("Skipping");
                status.set('status', 'skipped');
            }
        } else {
            console.log("Updating EIT");
            status.set('status', 'running');
            var ret = epg.updateEit();
            console.log("Eit updated!");
            if (ret) {
                epg.updateCarousel();
                console.log("Carousel updated!");
            }
            status.set('status', 'idle');
            status.set('lastRun', moment().toISOString());
            status.set('nextRun', moment().add(interval, 'ms').toISOString());
        }
    });
};
status.set('status', 'running', function() {
    console.log("Updating Eit");
    update();
    setInterval(update, interval);
});

