#!/bin/sh
_DIR=$("pwd")
empty=
space=$empty $empty
_PATH="$_DIR/perl/lib/bin${PATH+:}${PATH}"; export PATH=$_PATH;
_PERL5LIB="$_DIR/perl/lib/lib/perl5${PERL5LIB+:}${PERL5LIB}"; export PERL5LIB=$_PERL5LIB;
_PERL_LOCAL_LIB_ROOT="$_DIR/perl/lib${PERL_LOCAL_LIB_ROOT+:}${PERL_LOCAL_LIB_ROOT}"; export PERL_LOCAL_LIB_ROOT=$_PERL_LOCAL_LIB_ROOT;
_PERL_MB_OPT="--install_base$space\"$_DIR/perl/lib\""; export PERL_MB_OPT=$_PERL_MB_OPT;
_PERL_MM_OPT="INSTALL_BASE=$_DIR/perl/lib"; export PERL_MM_OPT=$_PERL_MM_OPT;
