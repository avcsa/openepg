var dbName = require('./conf').epg_db
,   fs     = require('fs')
;

function utils(){};

utils.prototype.deleteDb = function(done) {
    if (fs.existsSync(process.cwd() + "/" + dbName))
        fs.unlinkSync(process.cwd() + "/" + dbName);
    done();
};

exports = module.exports = function() {
    return new utils();
};