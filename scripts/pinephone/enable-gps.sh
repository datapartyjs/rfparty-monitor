#!/bin/sh
#
# stop ModemManager, run python script to upload AGPS data then restart ModemManager

echo "stopping gpsd"

sudo systemctl stop gpsd
sudo systemctl disable gpsd

echo "Waiting for modem"
/usr/lib/rfparty-monitor/scripts/pinephone/wait_for_modem.sh

echo "Is GPS turned on?"
sudo mmcli -m 0 --command="AT+QGPS?"

#echo "Turn off GPS"
#sudo mmcli -m 0 --command="AT+QGPSEND" # this ought to be sent only if the gps was on...

#echo "Is AGPS enabled?"
#sudo mmcli -m 0 --command="AT+QGPSXTRA?"

echo "Precautionary enabling of AGPS"
sudo mmcli -m 0 --command="AT+QGPSXTRA=1"

echo "Setting Time"

sudo mmcli -m 0 --command="$(/usr/lib/rfparty-monitor/scripts/pinephone/get_time.py)"

echo "Enabling modem GPS"
sudo mmcli -m 0 --command="AT+QGPS=1"

sleep 5

sudo systemctl start gpsd
echo "GPSd enabled"

echo "starting gpsd nmea logger"

sudo gpspipe -r -d -l -o /data/rfparty/gps/track.`date +"%Y%m%d%h%m%s"`.nmea &



