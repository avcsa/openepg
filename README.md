openepg
=======

Open Source EPG generator for DVB Multiplexers

openepg is a lightweight [node.js](http://nodejs.org/) program built around [cherryepg](http://epg.cherryhill.eu/), a perl library for generating a MPEG-TS stream with EIT (Event Information Table) data, ment to be run on a [Raspberry Pi](http://www.raspberrypi.org/).
It depends on [node-perl](https://github.com/tokuhirom/node-perl) to be able to use the library.

##Dependencies
###Perl (on Debian Wheezy)
```shell
sudo apt-get install perl libperl-dev
```
###Perl (on Raspbian)
```shell
sudo apt-get install perl libdbi-perl
sudo ln -s /usr/lib/libperl.so.5.14 /usr/lib/libperl.so
```
##Install
###Download
```shell
git clone https://github.com/avcsa/openepg.git
```
###Install (Production)
```shell
cd openepg
make install
```
###Install (Development)
```shell
cd openepg
make install-dev
```
##Run
openepg consist on 5 modules:
* Status server (serves status info from and to all modules, it always must be run first)
* Gui server (serves the HTTP server for the GUI)
* Importer server (handles the importation of EIT data from a provider)
* EIT updater server (updates current EIT data to be sent to the multiplexer)
* Carousel server (sends current EIT data to the multiplexer)

You can run all modules together or one by one (last recommended)

###Together (Production)
```shell
make serve
```
###Together (Development)
```shell
make serve-dev
```
###Status server (Production & Development)
```shell
make serve_status
```
###Importer server (Production & Development)
```shell
make serve_importer
```
###EIT Updater server (Production & Development)
```shell
make serve_eitupdater
```
###Carousel server (Production & Development)
```shell
make serve_carousel
```
###GUI server (Production)
```shell
make serve_gui
```
###GUI server (Development)
```shell
make build-dev
make serve_gui
```
##Monit
Inside the 'monit' folder you will find a series of bash scripts along with a monitrc file to use with [Monit](http://mmonit.com/monit/).
##Configuration
All configuration options are inside conf.json file.
##Importer
You will see there is a ftp importer and a reportv dataprovider. Most probably you will have another data provider, so take a look at these files and make your own implementation.  Both (importer and data provider) can be configured in conf.json
##TODO
* Replace cherryepg with a pure js implementation
* Allow config to be changed from the gui
* Hot reload of config on changes
* Move to a pure [Backbone](http://backbonejs.org/) data implementation, with push and pagination
* Write an autoupdate to be controlled from the GUI for automated download and install of new versions

##Feedback
Please let me know how does it go to you on github issues! 
##LICENSE
[GNU Affero General Public License](http://www.gnu.org/licenses/agpl-3.0.html)

Enjoy!
