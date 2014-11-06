var util     = require('util')
,   memwatch = require('memwatch')
;

function profiler() {
    this.intervalPid = false;
    this.heapDiff    = false;
};

profiler.prototype.init = function(profile) {
    if (profile) {
        memwatch.on('leak', function(info) {
            console.log("Leak info", info);
        });
        memwatch.on('stats', function(info) {
            console.log("Mem stats", info);
        });
    }
};

profiler.prototype.getMemoryUsage = function() {
    return util.inspect(process.memoryUsage());
};

profiler.prototype.printMemoryUsage = function(doProfile) {
    if (doProfile)
        console.log(this.getMemoryUsage());
};

profiler.prototype.initInterval = function(doProfile) {
    if (doProfile) {
        var self = this;
        this.initInterval = setInterval(function() {
            self.printMemoryUsage(true);
        }, 5000);
    }
};

profiler.prototype.cancelInterval = function() {
    if (this.intervalPid)
        clearInterval(this.intervalPid);
};

profiler.prototype.initHeapDiff = function(doProfile) {
    if (doProfile)
        this.heapDiff = new memwatch.HeapDiff();
};

profiler.prototype.finishHeapDiff = function() {
    if (this.heapDiff) {
        var diff = this.heapDiff.end();
        console.log("Heap Diff", JSON.stringify(diff, null, 4));
        this.heapDiff = false;
    }
};

exports = module.exports = function() {
    return new profiler();
};