#!/bin/bash

sudo mkdir -p /data/rfparty/ble
sudo mkdir -p /data/rfparty/gps
sudo mkdir -p /data/rfparty/wifi
sudo mkdir -p /data/rfparty/logs
sudo mkdir -p /data/rfparty/agps

activeLog=/data/rfparty/logs/active-log.txt
previousLog=/data/rfparty/logs/previous-log.txt

if [ -f "$previousLog" ]; then
  sudo rm $previousLog
fi

if [ -f "$activeLog" ]; then
  sudo mv $activeLog  $previousLog
fi


#echo "setting up pinephone gpsd"
#sudo /usr/lib/rfparty-monitor/scripts/pinephone/enable-gps.sh &

echo "setting monitor mode"
sudo airmon-ng start wlan1

echo "starting airodump"

sudo airodump-ng -w /data/rfparty/wifi/scan wlan1mon --gpsd &> /dev/null &

echo "starting blemonitor"

sessionStamp=`date +"%Y%m%d-%H-%M-%S"`

npm start --prefix /usr/lib/rfparty-monitor/ &> /data/rfparty/logs/log.$sessionStamp.txt &

sudo ln -s /data/rfparty/logs/log.$sessionStamp.txt /data/rfparty/logs/active-log.txt

#echo "starting gpsd logger"

sudo gpspipe -r -d -l -o /data/rfparty/gps/track.$sessionStamp.nmea &

sudo /usr/lib/rfparty-monitor/scripts/wake-loop.sh &

echo "started 🤘🏿"

