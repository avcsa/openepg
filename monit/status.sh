#!/bin/bash

 case $1 in
    start)
       sleep 3;
       cd /home/pi/openepg/;
       echo $$ > /home/pi/status.pid;
       exec 2>&1 make NODE=/usr/bin/node serve_status 1>/home/pi/status.out;
       ;;
     stop)  
       kill -9 -`cat /home/pi/status.pid`;
       rm /home/pi/status.pid;
       ;;
     *)  
       echo "usage: status.sh {start|stop}" ;;
 esac
 exit 0