var Carousel = require('./lib/carousel')
,   conf     = require('./conf')
,   carousel = new Carousel(conf.epg)
,   status   = require("./status_client")('carousel')
;

status.set('status', 'running', function() {
    console.log("Starting carousel");
    carousel.start();
});
