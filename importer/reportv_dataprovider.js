var fs        = require('fs')
,   zlib      = require('zlib')
,   readline  = require('readline')
,   moment    = require('moment')
,   _         = require('underscore')
,   iconvlite = require('iconv-lite')
;

function data_provider(importDir, files, timezone) {
    this.importDir = importDir;
    this.files     = files;
    this._processTimezone(timezone);
}

data_provider.prototype._processTimezone = function(timezone) {
    if (!timezone) 
        return;
    var tmp = timezone.split(":");
    var hours = parseInt(tmp[0]);
    if (hours < 0) {
        hours = hours * -1;
        this.positiveTimezone = false;
    } else {
        this.positiveTimezone = true;
    }
    var minutes = parseInt(tmp[1]);
    var tz = moment.duration({hours: hours, minutes: minutes});
    this.timezone =  tz;
};

data_provider.prototype.init = function() {
    this._resetTables();
};

data_provider.prototype._resetTables = function() {
    this.services = [];
    this.programs = [];
    this.events   = [];
};

data_provider.prototype.processFile = function(file, callback) {
    var self = this;
    var gzip = zlib.createGunzip();
    var inp = fs.createReadStream(self.importDir + "/" + file);
    console.log("Unzipping", file);
    var out = inp.pipe(gzip).pipe(iconvlite.decodeStream('cp865'))
            .on('end', function() {
                rl.close();
                console.log("End processing", file);
                if (file === self.files.services)
                    setTimeout(function() {callback({emit: true, type: "services", data: self.services});}, 3000);
                else if (file === self.files.programs)
                    callback({emit: false});
                else if (file === self.files.scheds)
                    setTimeout(function() {callback({emit: true, type: "events", data: self.events});}, 3000);
            });
    var rl = readline.createInterface({
        input: out,
        terminal: false
    });
    rl.on('line', function(line) {
        var data = line.split("|");
        if (file === self.files.services)
            self._processService(data);
        else if (file === self.files.programs)
            self._processProgram(data);
        else if (file === self.files.scheds)
            self._processSched(data);
    });
};

data_provider.prototype._processService = function(data) {
    var service = {};
    service.serviceId = parseInt(data[0]);
    service.comment   = data[2];
    this.services.push(service);
};

data_provider.prototype._processProgram = function(data) {
    var program = {};
    program.id                 = data[0];
    program.title              = data[1];
    program.actorFirstname1    = data[16];
    program.actorLastname1     = data[17];
    program.actorFirstname2    = data[19];
    program.actorLastname2     = data[20];
    program.actorFirstname3    = data[22];
    program.actorLastname3     = data[23];
    program.directorFirstname1 = data[76];
    program.directorLastname1  = data[77];
    program.directorFirstname2 = data[79];
    program.directorLastname2  = data[80];
    program.directorFirstname3 = data[82];
    program.directorLastname3  = data[83];
    program.type               = data[136];
    program.genre              = data[137];
    program.synopsis           = data[142];
    program.year               = data[143];
    program.rating             = data[144];
    program.chapter            = data[156];
    this.programs.push(program);
};

data_provider.prototype._processSched = function(data) {
    var sched = {};
    sched.serviceId = data[0];
    sched.programId = data[1];
    sched.date      = data[2];
    sched.time      = data[3];
    sched.duration  = data[4];
    this.events.push(this._generateEvent(sched));
};

data_provider.prototype._generateEvent = function(sched) {
    var event = {};
    event.start = moment(sched.date + ' ' + sched.time, "YYYYMMDD HHmm");
    if (this.timezone) {
        if (this.positiveTimezone)
            event.start = event.start.add(this.timezone);
        else
            event.start = event.start.subtract(this.timezone);
    }
    event.duration = moment.duration(
            {
                hours: parseInt(sched.duration.substring(0, 2)), 
                minutes: parseInt(sched.duration.substring(2, 4))
            });
    event.serviceId = parseInt(sched.serviceId);
    var program = _.findWhere(this.programs, {id: sched.programId});
    event.title = program.title;
    var synopsis = '';
    if (program.type)
        synopsis += program.type + '. ';
    if (program.genre)
        synopsis += program.genre + '. ';
    if (program.rating)
        synopsis += program.rating + '. ';
    if (program.year)
        synopsis += program.year + '. ';
    if (program.actorFirstname1) {
        synopsis += 'Actores: ' + program.actorFirstname1 + ' ' + program.actorLastname1;
        if (program.actorFirstname2) {
            synopsis += ', ' + program.actorFirstname2 + ' ' + program.actorLastname2;
            if (program.actorFirstname3) 
            synopsis += ', ' + program.actorFirstname3 + ' ' + program.actorLastname3;                
        }
        synopsis += '. ';
    }
    if (program.directorFirstname1) {
        synopsis += 'Directores: ' + program.directorFirstname1 + ' ' + program.directorLastname1;
        if (program.directorFirstname2) {
            synopsis += ', ' + program.directorFirstname2 + ' ' + program.directorLastname2;
            if (program.directorFirstname3) 
            synopsis += ', ' + program.directorFirstname3 + ' ' + program.directorLastname3;                
        }
        synopsis += '. ';
    }
    if (synopsis.length)
        synopsis += '\n';
    if (program.synopsis)
        synopsis += program.synopsis;
    if (program.chapter)
        synopsis += '\n' + program.chapter;
    event.synopsis = synopsis;
    return event;
};

exports = module.exports = function(importDir, files, timezone) {
    return new data_provider(importDir, files, timezone);
};