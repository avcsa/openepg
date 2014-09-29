var Perl   = require('perl').Perl
,   _      = require('underscore')
,   moment = require('moment')
,   fs     = require('fs')
;

function carousel(conf) {
    var instance = this;

    carousel = function() {
      return instance;
    };

    carousel.prototype = this;
    this.constructor = carousel;
    
    this.dbName = (conf.carousel_db || 'carousel.db');
    this.tsHost = (conf.ts_host || '239.0.0.1');
    this.tsPort = (conf.ts_port || 1234);
    this.pid    = (conf.pid || 18);
    
    this.perl = new Perl();
    
    this.perl.use('DVB::Carousel');
    
    if (!fs.existsSync(this.dbName)) {
        this._initDb();
    }
}

carousel.prototype._initDb = function() {
    this._carousel().initdb();
};

carousel.prototype.start = function(pid, host, port) {
    pid = this.pid;
    host = this.tsHost;
    port = this.tsPort;
    if (!pid)
        throw new Error("pid must be defined");
    else if (!host)
        throw new Error("host must be defined");
    else if (!port)
        throw new Error("port must be defined");
    
    this._carousel().start(pid, host, port);
},

carousel.prototype._carousel = function() {
    this.perl.evaluate("package Carousel; "
        + "use Socket; use POSIX qw(ceil); use Time::HiRes qw(usleep); "
        + "my $carousel = DVB::Carousel->new('" + this.dbName + "'); "
        + "sub initdb { "
            + "return $carousel->initdb(); "
        + "} "
        + "sub start { "
            + "my $self = shift; "
            + "my $pid = shift; "
            + "my $host = shift; "
            + "my $port = shift; "
            + "socket( my $target, PF_INET, SOCK_DGRAM, getprotobyname('udp')) or die( 'Error opening udp socket: $!'); "
            + "my $ipaddr = inet_aton( $host); "
            + "my $portaddr = sockaddr_in( $port, $ipaddr); "
            + "my $continuityCounter = 0; "
            + "my ( $uid, $event_id, $start, $stop, $touch ) = @_; "
            + "while( 1) { "
                + "my $meta = $carousel->getMts( $pid);"
                + "if( ! defined $meta) { "
                    + "print 'No MTS chunk found for playing\n'; "
                    + "sleep( 1); "
                    + "next; "
                + "} "
                + "my $interval = $$meta[1]; "
                + "my $mts = $$meta[2]; "
                + "my $mtsCount = length( $mts) / 188; "
                + "my $packetCounter = 0; "
                + "for ( my $j = 3 ; $j < length( $mts) ; $j += 188 ) { "
                    + "substr( $mts, $j, 1, chr( 0b00010000 | ( $continuityCounter & 0x0f ) ) ); "
                    + "$continuityCounter += 1; "
                + "} "
                + "my $i = $mtsCount % 7; "
                + "while ( $i > 0 && $i < 7) { "
                    + "$mts .= '\x47\x1f\xff\x10'.'\xff' x 184; "
                    + "$i += 1; "
                + "} "
                + "$mtsCount = length( $mts) / 188; "
                + "my $gap = ceil( $interval / $mtsCount * 7 * 1000); "
                + "while ($packetCounter < $mtsCount) { "
                    + "my $chunkCount = $mtsCount-$packetCounter; "
                    + "$chunkCount = 7 if $chunkCount > 7;  "
                    + "send( $target, substr( $mts, $packetCounter * 188, $chunkCount * 188), 0, $portaddr); "
                    + "$packetCounter += $chunkCount; "
                    + "usleep( $gap); "
                + "} "
            + "} "
        + "}"
    );
    return this.perl.getClass("Carousel");
};

exports = module.exports = function(conf) {
    var c = new carousel(conf);
    return c;
};