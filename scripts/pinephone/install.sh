#!/bin/sh
#
# stop ModemManager, run python script to upload AGPS data then restart ModemManager

echo "Downloading AGPS data"
sudo mkdir -p /data/rfparty/agps
sudo wget -O /data/rfparty/agps/xtra.bin https://xtrapath1.izatcloud.net/xtra.bin

sudo systemctl stop gpsd
sudo systemctl disable gpsd
sudo systemctl disable ModemManager.service
sudo systemctl stop ModemManager.service


/usr/lib/rfparty-monitor/scripts/pinephone/load_agps_data.py


sudo systemctl enable ModemManager.service
sudo systemctl start ModemManager.service
sudo systemctl start gpsd
