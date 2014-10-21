#!/bin/bash
NOWT=$(date +"%Y%m%d%H%M%S")

 case $1 in
    start)
       sleep 3;
       cd /home/pi/openepg/;
       echo $$ > /home/pi/carousel.pid;
       exec 2>&1 make NODE=/usr/bin/node serve_carousel 1>/home/pi/carousel-$NOWT.out;
       ;;
     stop)  
       GPID=$(cat /home/pi/carousel.pid);
       for PID in $(pstree -pn $GPID |grep -o "([[:digit:]]*)" |grep -o "[[:digit:]]*")
       do
           kill -9 $PID;
       done;
       rm /home/pi/carousel.pid;
       ;;
     *)  
       echo "usage: carousel.sh {start|stop}" ;;
 esac
 exit 0
