var home     = require('./controllers/home')
,   services = require('./controllers/services')
,   events   = require('./controllers/events')
;

module.exports.initialize = function(app) {
    app.get('/', home.index);
    app.get('/server', home.get);
    app.get('/server/:id', home.get);
    app.put('/server/:id', home.updateEit);
    app.get('/api/services', services.index);
    app.get('/api/services/:id', services.getById);
    app.post('/api/services', services.add);
//    app.put('/api/services', services.update);
    app.put('/api/services/:id', services.enable);
    app.get('/api/events', events.index);
    app.get('/api/events/:id', events.getById);
    app.post('/api/events', events.add);
//    app.put('/api/events', events.update);
    app.delete('/api/events/:id', events.delete);
};