var EventEmitter = require('events').EventEmitter
,   util         = require('util')
,   JSFtp        = require('jsftp')
,   _            = require('underscore')
,   fs           = require('fs')
,   crypto       = require('crypto')
//,   iconvlite    = require('iconv-lite')
;

function ftp_importer(options) {
    this.options = options;
    this.dataProvider = require('./' + this.options.data_provider)(this.options.import_dir, this.options.files);
    this.files = [this.options.files.services, this.options.files.programs, this.options.files.scheds];
    this.ftpOptions = {
        host: this.options.host,
        user: this.options.user,
        pass: this.options.pass
    };
}

util.inherits(ftp_importer, EventEmitter);

ftp_importer.prototype.run = function() {
    this.emit('start');
    this._run();
    setInterval(this._run.bind(this), this.options.interval_hours * 60 * 60 * 1000);
};

ftp_importer.prototype._run = function() {
    this.emit('run');
    this.dataProvider.init();
    var ftp = new JSFtp(this.ftpOptions);
    var self = this;
    ftp.on('error', function(err) {
        self.emit('error', err);
    });
    var i = 0;
    var get = function() {
        var file = self.files[i];
        console.log('Getting ' + file);
        ftp.get(file, self.options.import_dir + "/" + file, function(err) {
            if (err) {
                self.emit('error', err);
            } else {
                if (i !== (self.files.length - 1)) 
                    get(i++);
                else
                    self._checkFiles();
            }
        });
    };
    get();
};

ftp_importer.prototype._checkFiles = function() {
    console.log("Checking files version");
    var configFile = this.options.import_dir + '/check.json';
    var data = {files: []};
    var newData =[];
    if (fs.existsSync(configFile))
        data = JSON.parse(fs.readFileSync(configFile, 'utf8'));
    var i = 0;
    var self = this;
    var filesToProcess = [];
    var check = function() {
        var file = self.files[i];
        console.log('Checking ' + file);
        var fd = fs.createReadStream(self.options.import_dir + "/" + file);
        var hash = crypto.createHash('md5');
        hash.setEncoding('hex');

        fd.on('end', function() {
            hash.end();
            var checksum = hash.read();
            console.log("New Checksum for", file, checksum);
            var go = true;
            var _file = _.findWhere(data.files, {file: file});
            if (_file) {
                console.log("Old Checksum for", file, _file.checksum);
                if (_file.checksum === checksum)
                    go = false;
            }
            newData.push({file: file, checksum: checksum});
            if (go)
                filesToProcess.push(file);
            if (i !== (self.files.length - 1)) {
                check(i++);
            } else {
                console.log("Writing checksums to file", newData);
                fs.writeFileSync(self.options.import_dir + '/check.json', JSON.stringify({files: newData}, null, 4));
                if (filesToProcess.length) {
                    self._processFiles(filesToProcess);
                } else {
                    console.log("Everything uptodate");
                    self.emit('done');
                }
            }
        });

        fd.pipe(hash);
    };
    check();
};

ftp_importer.prototype._processFiles = function(filesToProcess) {
    console.log("Processing files", filesToProcess);
    var self = this;
    var i = 0;
    var process = function() {
        var file = filesToProcess[i];
        console.log('Processing ' + file);
        self.dataProvider.processFile(file, function(result) {
            if (result.emit)
                self.emit(result.type, result.data);
            
            if (i !== (self.files.length - 1)) 
                process(i++);
            else 
                self.emit('done');
        });
    };
    process();
};

exports = module.exports = function(options) {
    return new ftp_importer(options);
};

