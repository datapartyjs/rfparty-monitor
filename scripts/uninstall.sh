#!/bin/bash


echo Remove node permissions
sudo setcap -r $(eval readlink -f `which node`)

echo Removing Service
sudo sudo systemctl disable rfparty-monitor.service
sudo rm /etc/systemd/system/rfparty-monitor.service

echo Removing directory link
sudo rm /usr/lib/rfparty-monitor

echo Removing executable links
sudo rm $dir/bin/rfparty-info /usr/sbin/
sudo rm $dir/bin/rfparty-monitor /usr/sbin/

echo Party Over