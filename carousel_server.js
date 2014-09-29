var Carousel  = require('./lib/carousel')
,   conf = require('./conf')
,   carousel  = new Carousel(conf)
;

console.log("Starting carousel");
carousel.start();
