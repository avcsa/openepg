var moment = require('moment')
,   fs     = require('fs')
,   dnode  = require('dnode')
,   _      = require('underscore')
,   conf   = require('./conf').status
;

var server = {
    statusFile : "./status.json",
    locked : false,
    get : function(callback) {
        if (!server.locked) {
            server.locked = true;
            server._get(callback);
            server.locked = false;
        } else {
            console.log("Status locked, waiting...");
            setTimeout(function() {
                server.get(callback);
            }, 500);
        }
    },
    _get : function(callback) {
        console.log("Getting status");
        var statusData;
        if (fs.existsSync(server.statusFile)) {
            statusData = server.fixStatus(JSON.parse(fs.readFileSync(server.statusFile, 'utf8')));
        } else {
            statusData = {
                gui: {
                    started : undefined,
                    pid     : undefined,
                    status  : 'down'
                },
                carousel: {
                    started : undefined, 
                    pid     : undefined,
                    status  : 'down'
                }, 
                importer: {
                    started : undefined,
                    pid     : undefined,
                    status  : 'down', 
                    lastRun : undefined,
                    nextRun : undefined
                },
                eitUpdate: {
                    started : undefined,
                    pid     : undefined,
                    status  : 'down', 
                    lastRun : undefined,
                    nextRun : undefined
                }
            };
        }
        console.log("Returning status", statusData);
        if (callback)
            callback(statusData);
    },
    set : function(module, variable, value, callback) {
        if (!server.locked) {
            server.locked = true;
            server._setProperty(module, variable, value, callback);
            server.locked = false;
        } else {
            console.log("Status locked, waiting...");
            setTimeout(function() {
                server.set(module, variable, value, callback);
            }, 500);
        }
    }, 
    _setProperty : function(module, variable, value, callback) {
        console.log("Setting", module, variable, value);
        server._get(function(st) {
            st[module][variable] = value;
            fs.writeFileSync(server.statusFile, JSON.stringify(st, null, 4));
            server._get(callback);
        });
    }, 
    _setModule : function(module, moduleObj, callback) {
        console.log("Setting module", module, moduleObj);
        server._get(function(st) {
            console.log("status", st);
            st[module] = moduleObj;
            fs.writeFileSync(server.statusFile, JSON.stringify(st, null, 4));
            server._get(callback);
        });
    },
    register : function(module, pid, callback) {
        if (!server.locked) {
            server.locked = true;
            console.log("Registering module", module);
            server._get(function(st) {
                console.log("status", st);
                var mod = st[module];
                mod.started = moment();
                mod.status  = 'registered';
                mod.pid     = pid;
                server._setModule(module, mod, callback);
                server.locked = false;
            });
        } else {
            console.log("Status locked, waiting...");
            setTimeout(function() {
                server.register(module, callback);
            }, 500);
        }
    }, 
    fixStatus : function(st) {
        var modules = ['gui', 'importer', 'carousel', 'eitUpdate'];
        _.each(modules, function(module) {
            console.log("Checking ping on", module);
            var pid = st[module].pid;
            try {
                process.kill(pid, 0);
            } catch (err) {
                st[module].status = 'down';
                console.log(module, " is DOWN!");
            }
        });
        console.log("Returning fixed status", st);
        return st;
    }
};
var d = dnode(server);
d.listen(conf.port);
d.on('error', function(err) {
    console.error(err);
});
console.log("Status server up on port", conf.port);