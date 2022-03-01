#!/bin/bash


echo Remove node permissions
sudo setcap -r $(eval readlink -f `which node`)

echo Removing Service
sudo sudo systemctl disable rfparty-monitor.service
sudo rm /etc/systemd/system/rfparty-monitor.service

echo Removing directory link
sudo rm -rf /usr/lib/rfparty-monitor

echo Removing executable links
sudo rm /usr/sbin/rfparty-info
sudo rm /usr/sbin/rfparty-monitor

echo Party Over