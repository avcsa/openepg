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
    this.carouselDbName = (conf.carousel_db || 'carousel.db');
    var scheduledHours = (conf.scheduled_hours || 24);
    this.maxSegments = parseInt(scheduledHours / 3);
    this.interval = conf.eit_interval;
    this.pid    = (conf.pid || 18);
    
    this.perl = new Perl();
    
    this.perl.use('DVB::Epg');
    this.perl.use('DVB::Carousel');
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
 * signalId (int),
 * originalNetworkId (int),
 * transportStreamId (int),
 * serviceId (int), 
 * comment (string)
 */
epg.prototype.addService = function(service) {
    service.pid = this.pid;
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
    
    var services = _.filter(this.listServices(), function(serv) {
        return (serv.signalId === service.signalId) && (serv.serviceId !== service.serviceId);
    });
    if (services.length !== 0)
        throw new Error("can't add a service with an existent signalId");
    
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
    
    var services = _.filter(this.listServices(), function(service) {
        return ((filter.pid && (filter.pid === service.pid)) || (!filter.pid))
            && ((filter.signalId && (filter.signalId === service.signalId)) || (!filter.signalId))
            && ((filter.originalNetworkId && (filter.originalNetworkId === service.originalNetworkId)) || (!filter.originalNetworkId))
            && ((filter.transportStreamId && (filter.transportStreamId === service.transportStreamId)) || (!filter.transportStreamId));
    });

    var self = this;
    var serv = _.filter(services, function(service) {
        return self.listEvents({serviceId: service.serviceId}).length !== 0;
    });

    if (serv.length !== 0)
        throw new Error("can't delete services which have events");
    
    return this._epg().deleteEit(filter.pid, filter.signalId, filter.originalNetworkId, filter.transportStreamId);
};

/* 
 * EVENT ATTRS: 
 * id (int) -> IF NOT PROVIDED, ASSINGED INSIDE FUNCTION, 
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
    if (event.id) {
        _event.id = event.id;
    } else {
        var data = [];
        var self = this;
        _.each(services, function(service) {
            var events = self.listEvents({serviceId: service.serviceId});
            data = _.union(events, data);
        });
        if (!_.isEmpty(data))
            _event.id = _.max(data, function(evt) {return evt.id;}).id + 1;
        else
            _event.id = 1;
    }
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

/*
 * FILTER ATTRS (none required):
 * serviceId (int) 
 * eventId (int)
 * startMin (moment)
 * startMax (moment)
 * stopMin (moment)
 * stopMax (moment)
 */
epg.prototype.deleteEvents = function(filter) {
    if (!filter)
        filter = {};

    if (!filter.eventId)
        filter.eventId = false;
    if (!filter.serviceId)
        filter.serviceId = false;
    if (!filter.eventId)
        filter.eventId = false;
    if (filter.startMin  && moment.isMoment(filter.startMin))
        filter.startMin = this._getPerlDate(filter.startMin);
    else
        filter.startMin = false;
    if (filter.startMax  && moment.isMoment(filter.startMax))
        filter.startMax = this._getPerlDate(filter.startMax);
    else
        filter.startMax = false;
    if (filter.stopMin  && moment.isMoment(filter.stopMin))
        filter.stopMin = this._getPerlDate(filter.stopMin);
    else
        filter.stopMin = false;
    if (filter.stopMax  && moment.isMoment(filter.stopMax))
        filter.stopMax = this._getPerlDate(filter.stopMax);
    else
        filter.stopMax = false;
    
    return this._epg().deleteEvent(filter.serviceId, filter.eventId, filter.startMin, filter.startMax, filter.stopMin, filter.stopMax);
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

epg.prototype.updateEit = function(pid) {
    pid = this.pid;
    if (!pid)
        throw new Error("pid must be defined");
    var ret = this._epg().updateEit(pid);

    if (ret === 1)
        return true;
    else if (ret === 0)
        return false;
    else
        throw new Error("unknown error updating eit");
};

epg.prototype.getEit = function(pid) {
    pid = this.pid;
    if (!pid)
        throw new Error("pid must be defined");
    var ret = this._epg().getEit(pid, this.interval);
    if (ret)
        return ret;
    else
        throw new Error("unknown error geting eit");
};

epg.prototype.updateCarousel = function(pid) {
    pid = this.pid;
    if (!pid)
        throw new Error("pid must be defined");
    var ret = this._epg().updateCarousel(pid, this.interval);

    if (ret)
        return true;
    else
        throw new Error("unknown error updating carousel");
};

epg.prototype.getMaxEventId = function() {
    return this._epg().getMaxEventId();
};

epg.prototype._epg = function() {
    var now = moment();
    var returnNew = false;
    if (!this.__epg) {
        returnNew = true;
    } else {
        if (this.lastCall)
            returnNew = now.diff(this.lastCall, 'minutes') > 1;
        else
            returnNew = true;
    }
    if (returnNew) {
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
            + "} "
            + "sub deleteEvent { "
                + "my $self = shift; "
                + "my ( $uid, $event_id, $start_min, $start_max, $stop_min, $stop_max) = @_; "
                + "return $epg->deleteEvent(( ! $uid ? undef : $uid ), ( ! $event_id ? undef : $event_id ), ( ! $start_min ? undef : $start_min ), ( ! $start_max ? undef : $start_max ), ( ! $stop_min ? undef : $stop_min ), ( ! $stop_max ? undef : $stop_max )); "
            + "} "
            + "sub updateEit { "
                + "my $self = shift; "
                + "my $pid = shift; "
                + "return $epg->updateEit($pid); "
            + "}"
            + "sub getEit { "
                + "my $self = shift; "
                + "my $pid = shift; "
                + "my $timeFrame = shift; "
                + "return $epg->getEit($pid, $timeFrame); "
            + "}"
            + "sub updateCarousel { "
                + "my $self = shift; "
                + "my $pid = shift; "
                + "my $interval = shift; "
                + "my $carousel = DVB::Carousel->new('" + this.carouselDbName + "'); "
                + "my $pes = $epg->getEit( $pid, $interval); "
                + "return $carousel->addMts( $pid, \\$pes, $interval*1000); "
            + "}"
            + "sub getMaxEventId { "
                + "my $self = shift; "
                + "my $dbh  = $epg->{dbh}; "
                + "my @row = $dbh->selectrow_array( 'SELECT event_id FROM event ORDER BY event_id DESC LIMIT 1' ); "
                + "if ( $#row == 0 ) { "
                    + "return $row[0]; "
                + "} else { "
                    + "return 0 "
                + "} "
            + "}"
        );
        this.__epg = this.perl.getClass("Epg");
    }
    this.lastCall = now;
    return this.__epg;
};

exports = module.exports = function(conf) {
    var e = new epg(conf);
    return e;
};