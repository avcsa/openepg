#!/bin/bash

 case $1 in
    start)
       sleep 3;
       cd /home/pi/openepg/;
       echo $$ > /home/pi/gui.pid;
       exec 2>&1 make NODE=/usr/bin/node serve_gui 1>/home/pi/gui.out;
       ;;
     stop)  
       kill -9 -`cat /home/pi/gui.pid`;
       rm /home/pi/gui.pid;
       ;;
     *)  
       echo "usage: gui.sh {start|stop}" ;;
 esac
 exit 0