CWD=$(shell pwd)

.PHONY: test

perl:
	mkdir $(CWD)/perl
	
perl/local-lib-2.000014: perl/local-lib-2.000014.tar.gz
	cd $(CWD)/perl/; \
	tar xvzf local-lib-2.000014.tar.gz; \
	cd $(CWD)/perl/local-lib-2.000014/; \
	perl Makefile.PL --bootstrap=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install; 
	
perl/local-lib-2.000014.tar.gz: perl
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/H/HA/HAARG/local-lib-2.000014.tar.gz -s -o local-lib-2.000014.tar.gz; 
	
perl/Digest-CRC-0.18: perl/Digest-CRC-0.18.tar.gz
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	tar xvzf Digest-CRC-0.18.tar.gz; \
	cd $(CWD)/perl/Digest-CRC-0.18/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/Digest-CRC-0.18.tar.gz: perl/local-lib-2.000014
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/O/OL/OLIMAUL/Digest-CRC-0.18.tar.gz -s -o Digest-CRC-0.18.tar.gz; 
	
perl/DBD-SQLite-1.42: perl/DBD-SQLite-1.42.tar.gz
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	tar xvzf DBD-SQLite-1.42.tar.gz; \
	cd $(CWD)/perl/DBD-SQLite-1.42/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DBD-SQLite-1.42.tar.gz: perl/Digest-CRC-0.18
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/I/IS/ISHIGAKI/DBD-SQLite-1.42.tar.gz -s -o DBD-SQLite-1.42.tar.gz; 
	
perl/DVB-Carousel-0.22: perl/DVB-Carousel-0.22.tar.gz
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	tar xvzf DVB-Carousel-0.22.tar.gz; \
	cd $(CWD)/perl/DVB-Carousel-0.22/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DVB-Carousel-0.22.tar.gz: perl/DBD-SQLite-1.42
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/N/NA/NABOJ/DVB-Carousel-0.22.tar.gz -s -o DVB-Carousel-0.22.tar.gz; 
	
perl/DVB-Epg-0.51: perl/DVB-Epg-0.51.tar.gz
	cd $(CWD); \
	set -e; \
	. ./perl-vars.sh; \
	cd $(CWD)/perl/; \
	tar xvzf DVB-Epg-0.51.tar.gz; \
	cd $(CWD)/perl/DVB-Epg-0.51/; \
	perl Makefile.PL INSTALL_BASE=$(CWD)/perl/lib/; \
	make; \
	make test; \
	make install
	
perl/DVB-Epg-0.51.tar.gz: perl/DVB-Carousel-0.22
	cd $(CWD)/perl/; \
	curl -L http://search.cpan.org/CPAN/authors/id/N/NA/NABOJ/DVB-Epg-0.51.tar.gz -s -o DVB-Epg-0.51.tar.gz; 
	
perl-install: perl/DVB-Epg-0.51
	
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
	node server.js;
