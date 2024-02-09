#!/bin/bash

sudo apt install build-essential bluetooth bluez bluez-hcidump libbluetooth-dev libudev-dev gpsd gpsd-clients gpsbabel wireless-tools aircrack-ng libpcap-dev libavahi-compat-libdnssd-dev

sudo setcap cap_net_raw+eip $(eval readlink -f `which node`)
sudo setcap cap_net_raw+eip $(eval readlink -f `which nodejs`)