var assert = require('assert')
,   Epg    = require('../lib/epg')
,   utils  = require('./utils')()
,   fs     = require('fs')
,   conf   = require('./conf')
,   moment = require('moment')
,   _      = require('underscore')
;

before(function(done) {
    utils.deleteDb(done);
});

describe('epg', function() {
    var epg;
    describe('epg', function() {
        before(function(done) {
            epg = new Epg(conf);
            done();
        });
        it('db should exist', function() {
            var exists = fs.existsSync(process.cwd() + "/" + conf.epg_db);
            assert.ok(exists);
        });
        describe('service', function() {
            var globalService = undefined;
            describe('add', function() {
                it("without pid should throw error", function() {
                    var service = {};
                    assert.throws(function() {
                        epg.addService(service);
                    }, /pid.*defined/);
                });
                it("without signalId should throw error", function() {
                    var service = {};
                    service.pid = 18;
                    assert.throws(function() {
                        epg.addService(service);
                    }, /signalId.*defined/);
                });
                it("without originalNetworkId should throw error", function() {
                    var service = {};
                    service.pid = 18;
                    service.signalId = 1;
                    assert.throws(function() {
                        epg.addService(service);
                    }, /originalNetworkId.*defined/);
                });
                it("without transportStreamId should throw error", function() {
                    var service = {};
                    service.pid = 18;
                    service.signalId = 1;
                    service.originalNetworkId = 2;
                    assert.throws(function() {
                        epg.addService(service);
                    }, /transportStreamId.*defined/);
                });
                it("without serviceId should throw error", function() {
                    var service = {};
                    service.pid = 18;
                    service.signalId = 1;
                    service.originalNetworkId = 2;
                    service.transportStreamId = 3;
                    assert.throws(function() {
                        epg.addService(service);
                    }, /serviceId.*defined/);
                });
                it("without comment should throw error", function() {
                    var service = {};
                    service.pid = 18;
                    service.signalId = 1;
                    service.originalNetworkId = 2;
                    service.transportStreamId = 3;
                    service.serviceId = 4;
                    assert.throws(function() {
                        epg.addService(service);
                    }, /comment.*defined/);
                });
                it("if everything is fine, should not have errors", function(done) {
                    var service = {};
                    service.pid = 18;
                    service.signalId = 1;
                    service.originalNetworkId = 2;
                    service.transportStreamId = 3;
                    service.serviceId = 4;
                    service.comment = 'My TV Channel';
                    assert.doesNotThrow(function() {
                        epg.addService(service);
                        globalService = _.clone(service);
                    });
                    done();
                });
            });
            describe("list", function() {
                it ("previous test should have provided a 'globalService'", function() {
                    assert.ok(globalService);
                });
                it("list services should return 1 element", function() {
                    assert.equal(epg.listServices().length, 1);
                });
                it("list services should return the same service as 'globalService'", function() {
                    assert.ok(_.isEqual(epg.listServices()[0], globalService));
                });
                it("list pids should return 1 element", function() {
                    assert.equal(epg.listPids().length, 1);
                });
                it("list pids should return the same pid as 'globalService'", function() {
                    assert.equal(epg.listPids()[0], globalService.pid);
                });
            });
            describe("remove", function() {
                var service1 = undefined;
                var service2 = undefined;
                var service3 = undefined;
                var service4 = undefined;
                before(function(done) {
                    service1 = _.clone(globalService);
                    service1.pid = 19;
                    service1.originalNetworkId = 20;
                    service1.transportStreamId = 30;
                    service1.signalId = 40;
                    epg.addService(service1);
                    service2 = _.clone(globalService);
                    service2.pid = 20;
                    service2.originalNetworkId = 21;
                    service2.transportStreamId = 31;
                    service2.signalId = 41;
                    epg.addService(service2);
                    service3 = _.clone(globalService);
                    service3.pid = 21;
                    service3.originalNetworkId = 22;
                    service3.transportStreamId = 32;
                    service3.signalId = 42;
                    epg.addService(service3);
                    service4 = _.clone(globalService);
                    service4.pid = 22;
                    service4.originalNetworkId = 23;
                    service4.transportStreamId = 33;
                    service4.signalId = 43;
                    epg.addService(service4);
                    done();
                });
                it('there should be 5 services created', function() {
                    assert.equal(epg.listServices().length, 5);
                });
                it('deleting inexistent pid should return 0', function() {
                    assert.equal(epg.deleteServices({pid: 222}), 0);
                });
                it('deleting pid of service1 should return 1', function() {
                    assert.equal(epg.deleteServices({pid: service1.pid}), 1);
                });
                it('deleting inexistent originalNetworkId should return 0', function() {
                    assert.equal(epg.deleteServices({originalNetworkId: 222}), 0);
                });
                it('deleting originalNetworkId of service2 should return 1', function() {
                    assert.equal(epg.deleteServices({originalNetworkId: service2.originalNetworkId}), 1);
                });
                it('deleting inexistent transportStreamId should return 0', function() {
                    assert.equal(epg.deleteServices({transportStreamId: 222}), 0);
                });
                it('deleting transportStreamId of service3 should return 1', function() {
                    assert.equal(epg.deleteServices({transportStreamId: service3.transportStreamId}), 1);
                });
                it('deleting inexistent signalId should return 0', function() {
                    assert.equal(epg.deleteServices({signalId: 222}), 0);
                });
                it('deleting signalId of service4 should return 1', function() {
                    assert.equal(epg.deleteServices({signalId: service4.signalId}), 1);
                });
                it('deleting without params should return 1 (globalService)', function(done) {
                    assert.equal(epg.deleteServices(), 1);
                    done();
                });
            });
        });
        describe('events', function() {
            var service = {};
            var globalEvent = undefined;
            before(function(done) {
                service.pid = 18;
                service.signalId = 1;
                service.originalNetworkId = 2;
                service.transportStreamId = 3;
                service.serviceId = 4;
                service.comment = 'My TV Channel';
                epg.addService(service);
                done();
            });
            describe('add', function() {
                var testEvent = undefined;
                it('there should be 1 service created', function() {
                    assert.equal(epg.listServices().length, 1);
                });
                it("without serviceId should throw error", function() {
                    var event = {};
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /serviceId.*defined/);
                });
                it("without start should throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /start.*defined/);
                });
                it("if start is not a moment should throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    event.start = 123456;
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /start.*moment/);
                });
                it("without duration should throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    event.start = moment();
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /duration.*defined/);
                });
                it("if duration is not a moment.duration should throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    event.start = moment();
                    event.duration = 123456;
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /duration.*moment.duration/);
                });
                it("if duration is zero shold throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    event.start = moment();
                    event.duration = moment.duration();
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /duration.*0/);
                });
                it("if service does not exist, should throw error", function() {
                    var event = {};
                    event.serviceId = 9999;
                    event.start = moment();
                    event.duration = moment.duration(2, 'hours');
                    assert.throws(function() {
                        epg.addEvent(event);
                    }, /service.*exists/);
                });
                it("if everything is ok, shouldnt throw error", function() {
                    var event = {};
                    event.serviceId = service.serviceId;
                    event.start = moment();
                    event.duration = moment.duration(2, 'hours');
                    assert.doesNotThrow(function() {
                        testEvent = _.clone(event);
                        globalEvent = epg.addEvent(event);
                    });
                });   
                it("event created should have id = 0", function() {
                    assert.equal(globalEvent.id, 0);
                });
                it("event created should be equal to event sent", function() {
                    testEvent.id = 0;
                    testEvent.start = moment.unix(parseInt(testEvent.start.unix()));
                    assert.ok(_.isEqual(testEvent, globalEvent));
                });
            });
            describe('list', function() {
                it("previous test should have provided a 'globalEvent'", function() {
                    assert.ok(globalEvent);
                });
                it("without filter should throw error", function() {
                    assert.throws(function() {
                        epg.listEvents();
                    }, /provide.*filter/);
                });
                it("without serviceId should throw error", function() {
                    assert.throws(function() {
                        epg.listEvents({});
                    }, /serviceId.*defined/);
                });
                it("with inexistente serviceId should return 0 events", function() {
                    assert.equal(epg.listEvents({serviceId: 222}).length, 0);
                });
                it("with serviceId of globalEvent should return 1 events", function() {
                    assert.equal(epg.listEvents({serviceId: globalEvent.serviceId}).length, 1);
                });
                it("with serviceId of globalEvent should return the same event", function() {
                    assert.ok(_.isEqual(epg.listEvents({serviceId: globalEvent.serviceId})[0], globalEvent));
                });
                /*SEGUIR ESCRIBIENDO TESTS!!!*/
            });
        });
    }); 
});

//after(function(done) {
//    utils.deleteDb(done);
//});
