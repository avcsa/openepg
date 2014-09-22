var Perl   = require('perl').Perl
,   _      = require('underscore')
,   moment = require('moment')
,   fs     = require('fs')
;

function epg(conf) {
    var instance = this;

    epg = function() {
      return instance;
    };

    epg.prototype = this;
    this.constructor = epg;
    
    this.dbName = (conf.epg_db || 'eit.db');
    var scheduledHours = (conf.scheduled_hours || 24);
    this.maxSegments = parseInt(scheduledHours / 3);
    
    this.perl = new Perl();
    
    this.perl.use('DVB::Epg');
    this.perl.use('Time::Local');
    
    if (!fs.existsSync(this.dbName)) {
        this._initDb();
    }
}

epg.prototype._initDb = function() {
    this._epg().initdb();
};

/*
 * SERVICE ATTRS:
 * pid (int),
 * signalId (int),
 * originalNetworkId (int),
 * transportStreamId (int),
 * serviceId (int), 
 * comment (string)
 */
epg.prototype.addService = function(service) {
    if (!service.pid)
        throw new Error("pid must be defined");
    else if (!service.signalId)
        throw new Error("signalId must be defined");
    else if (!service.originalNetworkId)
        throw new Error("originalNetworkId must be defined");
    else if (!service.transportStreamId)
        throw new Error("transportStreamId must be defined");
    else if (!service.serviceId)
        throw new Error("serviceId must be defined");
    else if (!service.comment)
        throw new Error("comment must be defined");
    var result = this._epg().addEit(service.pid, service.signalId, service.originalNetworkId, service.transportStreamId, service.serviceId, this.maxSegments, 1, service.comment);
    if (result !== 1)
        throw new Error("unknown error adding service");
};

epg.prototype.listServices = function() {
    var services = this._epg().listEit();
    return _.map(services, this._getServiceFromPerl);
};

epg.prototype.listPids = function() {
    return this._epg().listPid.callList();
};

epg.prototype._getServiceFromPerl = function(service) {
    var _service = {};
    _service.pid = service[0];
    _service.signalId = service[1];
    _service.originalNetworkId = service[2];
    _service.transportStreamId = service[3];
    _service.serviceId = service[4];
    _service.comment = service[7];
    return _service;
};

/*
 * FILTER ATTRS (none required):
 * pid (int) 
 * signalId (int)
 * originalNetworkId (int)
 * transportStreamId (int)
 */
epg.prototype.deleteServices = function(filter) {
    if (!filter)
        filter = {};

    if (!filter.pid)
        filter.pid = false;
    if (!filter.signalId)
        filter.signalId = false;
    if (!filter.originalNetworkId)
        filter.originalNetworkId = false;
    if (!filter.transportStreamId)
        filter.transportStreamId = false;
    
    return this._epg().deleteEit(filter.pid, filter.signalId, filter.originalNetworkId, filter.transportStreamId);
};

/* 
 * EVENT ATTRS: 
 * id (int) -> ASSINGED INSIDE FUNCTION, 
 * start (moment), 
 * duration (moment.duration), 
 * serviceId (int), 
 * title (string), 
 * synopsis (string), 
 */
epg.prototype.addEvent = function(event) {
    if (!event.serviceId)
        throw new Error("serviceId must be defined");
    else if (!event.start)
        throw new Error("start must be defined");
    else if (!moment.isMoment(event.start))
        throw new Error("start must be a moment");
    else if (!event.duration)
        throw new Error("duration must be defined");
    else if (!moment.isDuration(event.duration))
        throw new Error("duration must be a moment.duration");
    else if (event.duration.asMilliseconds() === 0)
        throw new Error("duration must be greater than 0");
    
    var services = this.listServices();
    if (!_.find(services, function(service) {return service.serviceId === event.serviceId;}))
        throw new Error("can't add an event which service does not exists");
        
    var _event = {};
    _event.uid = event.serviceId;
    _event.start = this._getPerlDate(event.start);
    _event.stop = this._getPerlDate(moment(event.start).add(event.duration));
    var descriptors = [];
    var shortDescriptor = {};
    shortDescriptor.descriptor_tag = 0x4d;
    shortDescriptor.language_code = "spa";
    shortDescriptor.codepage_prefix = "";
    shortDescriptor.event_name = event.title;
    shortDescriptor.text = event.synopsis;
    descriptors.push(shortDescriptor);
    _event.descriptors = descriptors;
    event.id = this._epg().addEvent(_event);
    if (event.id) 
        return this.listEvents({serviceId: event.serviceId, eventId: event.id})[0];
    else 
        throw new Error("unknown error adding event");
};

/*
 * FILTER ATTRS (only serviceId is required):
 * serviceId (int) 
 * eventId (int)
 * start (moment) 
 * stop (moment)
 * lastUpdated (moment)
 */
epg.prototype.listEvents = function(filter) {
    if (!filter)
        throw new Error("must provide a filter");
    else if (!filter.serviceId)
        throw new Error("serviceId must be defined");

    if (!filter.eventId)
        filter.eventId = false;
    if (filter.start && moment.isMoment(filter.start))
        filter.start = this._getPerlDate(filter.start);
    else
        filter.start = false;
    
    if (filter.stop && moment.isMoment(filter.stop))
        filter.stop = this._getPerlDate(filter.stop);
    else
        filter.stop= false;
    
    if (filter.lastUpdated && moment.isMoment(filter.lastUpdated))
        filter.lastUpdated = this._getPerlDate(filter.lastUpdated);
    else
        filter.lastUpdated = false;
    
    var events = this._epg().listEvents.callList(filter.serviceId, filter.eventId, filter.start, filter.stop, filter.lastUpdated);
    return _.map(events, this._getEventFromPerl);
};

epg.prototype._epg = function() {
    this.perl.evaluate("package Epg; "
        + "my $epg = DVB::Epg->new('" + this.dbName + "'); "
        + "sub initdb { "
            + "return $epg->initdb(); "
        + "} "
        + "sub addEvent { "
            + "my $self = shift; "
            + "my ($event) = @_; "
            + "return $epg->addEvent($event); "
        + "}"
        + "sub listEvents { "
            + "my $self = shift; "
            + "my ( $uid, $event_id, $start, $stop, $touch ) = @_; "
            + "return $epg->listEvent($uid, ( ! $event_id ? undef : $event_id ), ( ! $start ? undef : $start ), ( ! $stop ? undef : $stop ), ( ! $touch ? undef : $touch )); "
        + "}"
        + "sub addEit { "
            + "my $self = shift; "
            + "my ( $pid, $service_id, $original_network_id, $transport_stream_id, $uid, $maxsegments, $actual, $comment ) = @_; "
            + "return $epg->addEit($pid, $service_id, $original_network_id, $transport_stream_id, $uid, $maxsegments, $actual, $comment); "
        + "}"
        + "sub listEit { "
            + "return $epg->listEit(); "
        + "} "
        + "sub listPid { "
            + "return $epg->listPid(); "
        + "} "
        + "sub deleteEit { "
            + "my $self = shift; "
            + "my ( $pid, $service_id, $original_network_id, $transport_stream_id) = @_; "
            + "return $epg->deleteEit(( ! $pid ? undef : $pid ), ( ! $service_id ? undef : $service_id ), ( ! $original_network_id ? undef : $original_network_id ), ( ! $transport_stream_id ? undef : $transport_stream_id )); "
        + "}"
    );
    return this.perl.getClass("Epg");
};

epg.prototype._getEventFromPerl = function(evt) {
    var event = {};
    event.id = evt.event_id;
    event.start = moment.unix(parseInt(evt.start));
    event.duration = moment.duration(parseInt(evt.stop) - parseInt(evt.start), 'seconds');
    event.serviceId = evt.uid;
    if (evt.descriptors && evt.descriptors[0]) {
        event.title = evt.descriptors[0].event_name;
        event.synopsis = evt.descriptors[0].text;
    }
    return event;
};

epg.prototype._getPerlDate = function(date) {
    return this.perl.evaluate("timelocal (" + date.seconds() + "," + date.minutes() + "," + date.hours() + "," + date.date() + "," + date.month() + "," + date.year() + ")");
};

exports = module.exports = function(conf) {
    var e = new epg(conf);
    return e;
};