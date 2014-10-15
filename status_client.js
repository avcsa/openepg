var dnode  = require('dnode')
,   conf   = require('./conf').status
;

function status_client(module) {
    this.module = module;
    this.d = dnode.connect(conf.port);
    this.serverUp = false;
    var self = this;
    this.d.on('remote', function(remote) {
        self.server = remote;
        self.server.register(self.module, process.pid, function(status) {
            console.log("Registration complete", status);
            self.status = status;
            self.serverUp = true;
        });
    });
}

status_client.prototype.set = function(prop, value, callback) {
    if (this.serverUp) {
        console.log("Setting property", prop, value);
        this.server.set(this.module, prop, value, callback);
    } else  {
        console.log("Server still not up, waiting...");
        var self = this;
        setTimeout(function() {
            console.log("Checking if server up...");
            self.set(prop, value, callback);
        }, 500);
    }
};

status_client.prototype.getStatus = function(callback) {
    this.server.get(callback);
};

exports = module.exports = function(module) {
    return new status_client(module);
};