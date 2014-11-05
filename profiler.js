var util = require('util');

function profiler() {
    this.intervalPid = false;
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

exports = module.exports = function() {
    return new profiler();
};