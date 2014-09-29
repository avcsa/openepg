CWD=$(shell pwd)

.PHONY: test

all: install serve

install: cherryepg-init

cherryepg-init: cherryepg-clean cherryepg-install

cherryepg-clean:
	@echo "Cleaning cherryepg"
	rm -rf cherryepg
	rm -f cherryEPG.tgz

cherryepg-get: cherryepg-download cherryepg-deps-download

cherryepg-download:
	@echo "Downloading cherryepg"
	curl http://epg.cherryhill.eu/download/cherryEPG.tgz -s -o cherryEPG.tgz; \
	tar xvzf cherryEPG.tgz; \
	cd $(CWD)/cherryepg/packages/; \
	tar xvzf DVB-Carousel-0.22.tar.gz; \
	tar xvzf DVB-Epg-0.50.tar.gz

cherryepg-install: cherryepg-get cherryepg-mods-install cherryepg-deps-install

cherryepg-deps-download: digest-download sqlite-download

digest-download: 
	@echo "Downloading Digest-CRC"
	cd $(CWD)/cherryepg/packages/; \
	curl -L http://search.cpan.org/CPAN/authors/id/O/OL/OLIMAUL/Digest-CRC-0.18.tar.gz -s -o Digest-CRC-0.18.tar.gz; \
	tar xvzf Digest-CRC-0.18.tar.gz

sqlite-download: 
	@echo "Downloading SQLite"
	cd $(CWD)/cherryepg/packages/; \
	curl -L http://search.cpan.org/CPAN/authors/id/I/IS/ISHIGAKI/DBD-SQLite-1.42.tar.gz -s -o DBD-SQLite-1.42.tar.gz; \
	tar xvzf DBD-SQLite-1.42.tar.gz

cherryepg-deps-install: digest-install sqlite-install

digest-install:
	@echo "Installing Digest-CRC"
	cd $(CWD)/cherryepg/packages/Digest-CRC-0.18/; \
	perl Makefile.PL; \
	make; \
	make test; \
	make install

sqlite-install:
	@echo "Installing SQLite"
	cd $(CWD)/cherryepg/packages/DBD-SQLite-1.42/; \
	perl Makefile.PL; \
	make; \
	make test; \
	make install

cherryepg-mods-install: cherryepg-carousel-install cherryepg-epg-install

cherryepg-epg-install:
	@echo "Installing DVB-Epg"
	cd $(CWD)/cherryepg/packages/DVB-Epg-0.50/; \
	perl Makefile.PL; \
	make; \
	make test; \
	make install

cherryepg-carousel-install:
	@echo "Installing DVB-Carousel"
	cd $(CWD)/cherryepg/packages/DVB-Carousel-0.22/; \
	perl Makefile.PL; \
	make; \
	make test; \
	make install 
	
test: 
	@echo "Testing modules"
	cd $(CWD); \
	node_modules/mocha/bin/./mocha --reporter spec;