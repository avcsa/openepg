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
    this.servicesDataFile = './data/services.json';
    this.eventsPath = './data/events/';
    this._initData();
}

epg.prototype._initDb = function() {
    this._epg().initdb();
};

epg.prototype._initData = function() {
    if (!fs.existsSync(this.servicesDataFile)) {
        var services = {
            services: []
        };
        fs.writeFileSync(this.servicesDataFile, JSON.stringify(services, null, 4));
    }
    if (!fs.existsSync(this.eventsPath)) {
        fs.mkdir(this.eventsPath);
    }
};

epg.prototype.addServices = function(services) {
    console.log("Updating services");
    var self = this;
    var enabledServices = this._listEnabledServices();
    var disabledServices = this._listDisabledServices();
    _.each(services, function(service) {
        console.log("Updating service", service.comment);
        if (_.findWhere(enabledServices, {serviceId: service.serviceId}))
            service.enabled = true;
        else
            service.enabled = false;
        console.log("Enabled: ", service.enabled);
        console.log("Removing events");
        var x = self.deleteEvents({serviceId: service.serviceId});
        console.log(x, "events removed");
        console.log("Updating service");
        if (service.enabled) {
            self._addEnabledService(service);
        } else {
            disabledServices = _.reject(disabledServices, function(srv) {return service.serviceId === srv.serviceId;});
            disabledServices.push(service);
        }
    });
    console.log("Writing disabled services to disk");
    fs.writeFileSync(this.servicesDataFile, JSON.stringify({services: disabledServices}, null, 4));
};

epg.prototype.enableDisableService = function(serviceId) {
    serviceId = parseInt(serviceId);
    var service = _.findWhere(this.listServices(), {serviceId: serviceId});
    if (!service.enabled) 
        this._enableService(service);
    else
        this._disableService(service);
    console.log("Updating EIT after enable/disable");
    var ret = this.updateEit();
    if (ret) {
        console.log("EIT updated, updating Carousel");
        this.updateCarousel();
    }        
};

epg.prototype._enableService = function(service) {
    var self = this;
    console.log("Enabling ", service.comment);
    service.enabled = true;
    this._addEnabledService(service);
    console.log("Enabling events");
    var events = this._listDisabledEvents({serviceId: service.serviceId});
    _.each(events, function(evt) {
        console.log("Adding enabled event", evt.title);
        self._addEnabledEvent(evt);
    });
    console.log("Deleting disbled events");
    this._deleteDisabledEvents({serviceId: service.serviceId});
    console.log("Deleting disabled service");
    this._deleteDisabledService(service);
};

epg.prototype._disableService = function(service) {
    console.log("Disabling ", service.comment);
    var self = this;
    var eventsData = [];
    service.enabled = false;
    this._addDisabledService(service);
    var events = this._listEnabledEvents({serviceId: service.serviceId});
    _.each(events, function(evt) {
        console.log("Disabling event", evt.title);
        eventsData.push(self._getEventForSave(evt, false));
    });
    console.log("Writing disabled events");
    this._saveDisabledEventsForService(service.serviceId, eventsData);
    console.log("Removing events from", service.comment);
    this._deleteEnabledEvents({serviceId: service.serviceId});
    console.log("Removing service", service.comment);
    this._deleteEnabledService(service);
};
/*
 * SERVICE ATTRS:
 * signalId (int),
 * originalNetworkId (int),
 * transportStreamId (int),
 * serviceId (int), 
 * comment (string)
 * enabled (boolean)
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
    
    var services = this.listServices();
    
    services = _.filter(services, function(serv) {
        return (serv.signalId === service.signalId) && (serv.serviceId !== service.serviceId);
    });
    
    if (services.length !== 0)
        throw new Error("can't add a service with an existent signalId");
    
    this._addService(service);
};

epg.prototype._addService = function(service) {
    if (service.enabled) 
        this._addEnabledService(service);
    else 
        this._addDisabledService(service);
};

epg.prototype._addEnabledService = function(service) {
    service.pid = this.pid;
    var result = this._epg().addEit(service.pid, service.signalId, service.originalNetworkId, service.transportStreamId, service.serviceId, this.maxSegments, 1, service.comment);
    if (result !== 1)
        throw new Error("unknown error adding service");
};

epg.prototype._addDisabledService = function(service) {
    var data = fs.readFileSync(this.servicesDataFile, 'utf8');
    var servicesData = JSON.parse(data);
    var services = servicesData.services;
    services.push(service);
    fs.writeFileSync(this.servicesDataFile, JSON.stringify({services: services}, null, 4));    
};

epg.prototype.listServices = function() {
    var enabledServices = this._listEnabledServices();
    var disabledServices = this._listDisabledServices();
    var ret = _.union(enabledServices, disabledServices);
    return ret;
};

epg.prototype._listEnabledServices = function() {
    var services = this._epg().listEit();
    var ret = _.map(services, this._getServiceFromPerl);
    return ret;
};

epg.prototype._listDisabledServices = function() {
    var data = fs.readFileSync(this.servicesDataFile, 'utf8');
    var servicesData = JSON.parse(data);
    var ret = _.map(servicesData.services, function(service) {
        service.enabled = false;
        return service;
    });
    return ret;
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
    _service.enabled = true;
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
    
    var i = 0;
    _.each(services, function(service) {
        var deleted = self._deleteService(service);
        i = i + deleted;
    });
    return i;
};

epg.prototype._deleteService = function(service) {
    var self = this;
    var deleted = 0;
    if (service.enabled)
        deleted = self._deleteEnabledService(service);
    else
        deleted = self._deleteDisabledService(service);
    return deleted;
};

epg.prototype._deleteEnabledService = function(service) {
    return this._epg().deleteEit(service.pid, service.signalId, service.originalNetworkId, service.transportStreamId);
};

epg.prototype._deleteDisabledService = function(service) {
    var data = fs.readFileSync(this.servicesDataFile, 'utf8');
    var servicesData = JSON.parse(data);
    var services = servicesData.services;
    var before = services.length;
    services = _.reject(services, function(serv) {
        return service.serviceId === serv.serviceId;
    });
    var after = services.length;
    fs.writeFileSync(this.servicesDataFile, JSON.stringify({services: services}, null, 4));    
    return before - after;
};

epg.prototype.addEvents = function(events) {
    console.log("Adding events");
    var self = this;
    var services = this.listServices();
    var eventId = this.getMaxEventId();
    var evts = [];
    var serviceId;
    var enabled;
    _.each(_.sortBy(events, "serviceId"), function(evt) {
        if (!serviceId) {
            serviceId = evt.serviceId;
            enabled = _.findWhere(services, {serviceId: evt.serviceId}).enabled;
        }
        eventId++;
        evt.id = eventId;
        console.log("Adding event", evt.title, "[Enabled: " + enabled + "]");
        if (enabled) {
            self._addEnabledEvent(evt);
        } else {
            if (evt.serviceId !== serviceId) {
                console.log("Adding events for service", serviceId, "[Enabled: " + enabled + "]");
                self._saveDisabledEventsForService(serviceId, evts);
                evts = [];
                serviceId = evt.serviceId;
                enabled = _.findWhere(services, {serviceId: evt.serviceId}).enabled;
            }
            evts.push(self._getEventForSave(evt, false));
        }
    });
    if (!enabled) {
        console.log("Adding events for service", serviceId, "[Enabled: " + enabled + "]");
        this._saveDisabledEventsForService(serviceId, evts);
    }
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
        
    var _event = this._addEvent(event);
    if (_event.id) {
        return this.listEvents({serviceId: _event.serviceId, eventId: _event.id})[0];
    } else {
        console.log("unknown error adding event", event.id, _event);
        throw new Error("unknown error adding event");
    }
};

epg.prototype._addEvent = function(event) {
    var service = _.findWhere(this.listServices(), {serviceId: event.serviceId});
    if (service.enabled)
        return this._addEnabledEvent(event);
    else
        return this._addDisabledEvents(event);
};

epg.prototype._addEnabledEvent = function(event) {
    var _event = this._getEventForSave(event, true);
    event.id = this._epg().addEvent(_event);
    return event;
};

epg.prototype._addDisabledEvent = function(event) {
    var _event = this._getEventForSave(event, false);
    var events = this._listDisabledEvents({serviceId: event.serviceId});
    events.push(_event);
    this._saveDisabledEventsForService(event.serviceId, events);
    return event;
};

epg.prototype._saveDisabledEventsForService = function(serviceId, events) {
    var file = this.eventsPath + serviceId + ".json";
    console.log("Writing", events.length, "events to", file);
    fs.writeFileSync(file, JSON.stringify({events: events}, null, 4));
};

epg.prototype._getEventForSave = function(event, enabled) {
    var _event = {};
    if (event.id) {
        _event.id = event.id;
    } else {
        var maxId = this.getMaxEventId();
        _event.id = maxId + 1;
    }
    if (enabled) {
        _event.uid = event.serviceId;
        _event.start = this._getPerlDate(moment(event.start));
        if (event.duration)
            _event.stop = this._getPerlDate(moment(event.start).add(event.duration));
        else
            _event.stop = this._getPerlDate(moment(event.stop));
        var descriptors = [];
        var shortDescriptor = {};
        shortDescriptor.descriptor_tag = 0x4d;
        shortDescriptor.language_code = "spa";
        shortDescriptor.codepage_prefix = "";
        shortDescriptor.event_name = this._fixChars(event.title);
        shortDescriptor.text = this._fixChars(event.synopsis);
        descriptors.push(shortDescriptor);
        _event.descriptors = descriptors;
    } else {
        _event.serviceId = event.serviceId;
        _event.start = moment(event.start);
        if (event.duration)
            _event.stop = moment(event.start).add(event.duration);
        else
            _event.stop = moment(event.stop);
        _event.title = event.title;
        _event.synopsis = event.synopsis;
    }
    return _event;
};

epg.prototype._fixChars = function(string) {
    var result = this._replaceAll(string, 'á', 'a');
    result = this._replaceAll(result, 'é', 'e');
    result = this._replaceAll(result, 'í', 'i');
    result = this._replaceAll(result, 'ó', 'o');
    result = this._replaceAll(result, 'ú', 'u');
    result = this._replaceAll(result, 'Á', 'A');
    result = this._replaceAll(result, 'É', 'E');
    result = this._replaceAll(result, 'Í', 'I');
    result = this._replaceAll(result, 'Ó', 'O');
    result = this._replaceAll(result, 'Ú', 'U');
    result = this._replaceAll(result, 'Ñ', 'N');
    result = this._replaceAll(result, 'ñ', 'n');
    result = this._replaceAll(result, '¿', '');
    result = this._replaceAll(result, '¡', '');
    return result;
};

epg.prototype._escapeRegExp = function(string) {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
};

epg.prototype._replaceAll = function(string, find, replace) {
  return string.replace(new RegExp(this._escapeRegExp(find), 'g'), replace);
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
    
    filter.serviceId = parseInt(filter.serviceId);
    
    var ret = _.map(this._listEvents(filter), function(evt) {
        evt.start = moment(evt.start);
        evt.stop = moment(evt.stop);
        evt.duration = moment.duration(moment(evt.stop).diff(moment(evt.start)));
        delete evt.stop;
        return evt;
    });
    return ret;
};

epg.prototype._listEvents = function(filter) {
    var enabled = this._listEnabledEvents(filter);
    var disabled = this._listDisabledEvents(filter);
    return _.union(enabled, disabled);
};

epg.prototype._listEnabledEvents = function(filter) {
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
    var ret = _.map(events, this._getEventFromPerl);
    return ret;
};

epg.prototype._listDisabledEvents = function(filter) {
    var fileName = this.eventsPath + filter.serviceId + ".json";
    var eventsData = [];
    if (fs.existsSync(fileName))
        eventsData = JSON.parse(fs.readFileSync(fileName, 'utf8')).events;
    
    var retData = _.filter(eventsData, function(evt) {
        if (filter.eventId && (filter.eventId === evt.id))
            return true;
        if (filter.start && moment.isMoment(filter.start) && filter.start.isAfter(evt.start))
            return false;
        if (filter.stop && moment.isMoment(filter.stop) && filter.stop.isBefore(evt.stop))
            return false;
        return true;
    });
    return retData;
};

/*
 * FILTER ATTRS (only serviceId required):
 * serviceId (int) 
 * eventId (int)
 * startMin (moment)
 * startMax (moment)
 * stopMin (moment)
 * stopMax (moment)
 */
epg.prototype.deleteEvents = function(filter) {
    if (!filter)
        throw new Error("Must provide a filter");
    else if (!filter.serviceId)
        throw new Error("serviceId must be defined");
    
    var ret = this._deleteEnabledEvents(filter);
    var ret2 = this._deleteDisabledEvents(filter);
    return ret + ret2;
};

epg.prototype._deleteDisabledEvents = function(filter) {
    var events = this._listDisabledEvents({serviceId: filter.serviceId});
    var before = events.length;
    events = _.reject(events, function(event) {
        if (filter.eventId && (filter.eventId === event.id))
            return true;
        if (filter.startMin && moment.isMoment(filter.startMin) && filter.startMin.after(event.start))
                return false;
        if (filter.startMax && moment.isMoment(filter.startMax) && filter.startMax.before(event.start))
                return false;
        if (filter.stopMin && moment.isMoment(filter.stopMin) && (filter.stopMin.after(event.stop)))
            return false;
        if (filter.stopMax && moment.isMoment(filter.stopMax) && (filter.stopMax.before(event.stop)))
            return false;
        return true;
    });
    var after = events.length;
    this._saveDisabledEventsForService(filter.serviceId, events);
    return before - after;
};

epg.prototype._deleteEnabledEvents = function(filter) {
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
    event.stop = moment.unix(parseInt(evt.stop));
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
    var self = this;
    var ret = this._epg().getMaxEventId();
    var services = this._listDisabledServices();
    var ids = [];
    if (ret)
        ids.push(ret);
    _.each(services, function(service) {
        var evts = self._listDisabledEvents({serviceId: service.serviceId});
        if (!_.isEmpty(evts)) {
            var events = _.pluck(evts, "id");
            if (!_.isEmpty(events)) {
                var max = _.max(events);
                ids.push(max);
            }
        }
    });
    if (!_.isEmpty(ids))
        return _.max(ids);
    else
        return 0;
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
                + "$carousel->initdb(); "
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