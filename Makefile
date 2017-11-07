CWD=$(shell pwd)
NODE?=$(shell which node)

.PHONY: test

perl:
	mkdir $(CWD)/perl
	
perl/local-lib-2.000014:
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/H/HA/HAARG/local-lib-2.000014.tar.gz -s -o local-lib-2.000014.tar.gz; \
	tar xvzf local-lib-2.000014.tar.gz; \
	cd $(CWD)/perl/local-lib-2.000014/; \
	perl Makefile.PL --bootstrap=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install; 
	
perl/Digest-CRC-0.18:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/O/OL/OLIMAUL/Digest-CRC-0.18.tar.gz -s -o Digest-CRC-0.18.tar.gz; \
	tar xvzf Digest-CRC-0.18.tar.gz; \
	cd $(CWD)/perl/Digest-CRC-0.18/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DBD-SQLite-1.42: 
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	curl -L http://pkgs.fedoraproject.org/repo/pkgs/perl-DBD-SQLite/DBD-SQLite-1.42.tar.gz/86cfaf477cb9ddc39508f74f4268fc79/DBD-SQLite-1.42.tar.gz -s -o DBD-SQLite-1.42.tar.gz; \
	tar xvzf DBD-SQLite-1.42.tar.gz; \
	cd $(CWD)/perl/DBD-SQLite-1.42/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DVB-Carousel-0.22:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	curl -L http://mirror.nus.edu.sg/CPAN/modules/by-module/DVB/DVB-Carousel-0.22.tar.gz -s -o DVB-Carousel-0.22.tar.gz; \
	tar xvzf DVB-Carousel-0.22.tar.gz; \
	cd $(CWD)/perl/DVB-Carousel-0.22/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DVB-Epg-0.51:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/N/NA/NABOJ/DVB-Epg-0.51.tar.gz -s -o DVB-Epg-0.51.tar.gz; \
	tar xvzf DVB-Epg-0.51.tar.gz; \
	cd $(CWD)/perl/DVB-Epg-0.51/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl-install: perl perl/local-lib-2.000014 perl/Digest-CRC-0.18 perl/DBD-SQLite-1.42 perl/DVB-Carousel-0.22 perl/DVB-Epg-0.51
	
npm-install-dev: 
	npm install --verbose

npm-install-prod: 
	npm install --production

install-dev: perl-install npm-install-dev init-dev
	
install: perl-install npm-install-prod
	
remove-perl:
	rm -rf $(CWD)/perl
	
remove-npm:
	rm -rf node_modules
	
remove-grunt:
	node_modules/grunt-cli/bin/grunt clean:all
	
uninstall: remove-perl remove-grunt clean-npm
	
init-dev:
	node_modules/grunt-cli/bin/grunt init:dev

build-dev:
	node_modules/grunt-cli/bin/grunt build:dev
	
build-prod:
	node_modules/grunt-cli/bin/grunt build:prod
	
serve-dev: build-dev serve

serve:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	$(NODE) status_server.js& node server.js& node carousel_server.js& node importer_server.js& node eitupdater_service.js;

serve_carousel:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	$(NODE) carousel_server.js;

serve_importer:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	$(NODE) importer_server.js;

serve_gui:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	$(NODE) server.js;

serve_status:
	cd $(CWD); \
	$(NODE) status_server.js;

serve_eitupdater:
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	$(NODE) eitupdater_server.js;

