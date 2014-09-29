var express = require('express')
,   http   = require('http')
,   path   = require('path')
,   routes = require('./routes')
,   exphbs = require('express3-handlebars')
,   models = require('./models')
,   app    = express()
;

app.set('port', process.env.PORT || 3300);
app.set('views', __dirname + '/views');
app.engine('handlebars', exphbs({
    defaultLayout: 'main',
    layoutsDir: app.get('views') + '/layouts'
}));
app.set('view engine', 'handlebars');

app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('openepg-will-rull-the-world'));
app.use(app.router);
app.use('/', express.static(path.join(__dirname, 'public')));

// development only
if ('development' === app.get('env')) {
    app.use(express.errorHandler());
}

//connect to the db server:
//routes list:
routes.initialize(app);

//updateEit
var update = function(err, success) {
    if (!err)
        console.log("Eit updated!");
    else
        console.error("Error updating eit", err);
};
console.log("Updating Eit");
models.Server.updateEit(update);
setInterval(function() {
    models.Server.updateEit(update);
}, 3 * 60 * 60 * 1000);

//finally boot up the server:
http.createServer(app).listen(app.get('port'), function() {
    console.log('Server up: http://localhost:' + app.get('port'));
});

