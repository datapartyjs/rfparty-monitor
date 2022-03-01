#!/bin/bash

sudo mkdir -p /data/ble
sudo mkdir -p /data/gps
sudo mkdir -p /data/wifi
sudo mkdir -p /data/logs


echo "setting monitor mode"
sudo airmon-ng start wlan1

echo "starting airodump"

sudo airodump-ng -w /data/wifi/scan wlan1mon --gpsd &> /dev/null &

echo "starting blemonitor"

npm start --prefix /usr/bin/rfparty-monitor/ &> /data/logs/ble-output.txt &

echo "starting gpsd logger"

sudo gpspipe -r -d -l -o /data/gps/track.`date +"%Y%m%d%h%m%s"`.nmea &

echo "started 🤘🏿"
