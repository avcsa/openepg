#!/bin/bash

 case $1 in
    start)
       sleep 3;
       cd /home/pi/openepg/;
       echo $$ > /home/pi/eitupdater.pid;
       exec 2>&1 make NODE=/usr/bin/node serve_eitupdater 1>/home/pi/eitupdater.out;
       ;;
     stop)  
       GPID=$(cat /home/pi/eitupdater.pid);
       for PID in $(pstree -pn $GPID |grep -o "([[:digit:]]*)" |grep -o "[[:digit:]]*")
       do
           kill -9 $PID;
       done;
       rm /home/pi/eitupdater.pid;
       ;;
     *)  
       echo "usage: eitupdater.sh {start|stop}" ;;
 esac
 exit 0