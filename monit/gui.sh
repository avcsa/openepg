#!/bin/bash
NOWT=$(date +"%Y%m%d%H%M%S")

 case $1 in
    start)
       sleep 3;
       cd /home/pi/openepg/;
       echo $$ > /home/pi/gui.pid;
       exec 2>&1 make NODE=/usr/bin/node serve_gui 1>/home/pi/gui-$NOWT.out;
       ;;
     stop)  
       GPID=$(cat /home/pi/gui.pid);
       for PID in $(pstree -pn $GPID |grep -o "([[:digit:]]*)" |grep -o "[[:digit:]]*")
       do
           kill -9 $PID;
       done;
       rm /home/pi/gui.pid;
       ;;
     *)  
       echo "usage: gui.sh {start|stop}" ;;
 esac
 exit 0