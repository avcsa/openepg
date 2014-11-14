var conf     = require('./conf')
,   epg      = require('./lib/epg')(conf.epg)
,   moment   = require('moment')
,   status   = require("./status_client")('eitUpdate')
,   profiler = require('./profiler')()
;

var profile = conf.eit_updater.profile;
var forceCarousel = conf.eit_updater.forceCarousel;

var interval = conf.eit_updater.interval_hours * (60 * 60 * 1000);
if (profile && conf.eit_updater.profiler_interval)
    interval = conf.eit_updater.profiler_interval;
var retry_interval = conf.eit_updater.retry_interval_minutes * (60 * 1000);

var update = function(firstRun) {
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
            if (!firstRun) {
                var mem = process.memoryUsage();
                var memMB = mem.rss / 1048576;
                console.log("Memory used:", memMB, "MB");
                if (memMB > conf.eit_updater.max_memory_mb) {
                    console.log("Exceeded limit of", conf.eit_updater.max_memory_mb, "MB, exiting...");
                    process.exit();
                }
            }
            console.log("Updating EIT");
            profiler.printMemoryUsage(profile);
            profiler.initHeapDiff(profile);
            status.set('status', 'running');
            var ret = epg.updateEit();
            console.log("Eit updated!");
            profiler.printMemoryUsage(profile);
            if (ret || forceCarousel) {
                epg.updateCarousel();
                console.log("Carousel updated!");
                profiler.printMemoryUsage(profile);
            }
            process.nextTick(function() {
                console.log("Forcing gc");
                profiler.finishHeapDiff();
                profiler.printMemoryUsage(profile);
            });
            status.set('status', 'idle');
            status.set('lastRun', moment().toISOString());
            status.set('nextRun', moment().add(interval, 'ms').toISOString());
        }
    });
};
status.set('status', 'running', function() {
    profiler.init(profile);
    console.log("Running initial update...");
    update(true);
    setInterval(update, interval);
});

