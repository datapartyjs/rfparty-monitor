# rfparty-monitor [![stability-experimental](https://img.shields.io/badge/stability-experimental-orange.svg)](https://github.com/emersion/stability-badges#experimental)


[rfparty is a new way to see BLE](https://blog.dataparty.xyz/blog/rfparty-a-new-way-to-see-ble/)

## Components

[rfparty-monitor](https://github.com/datapartyjs/rfparty-monitor) 

[rfparty.xyz](https://rfparty.xyz) ( [code](https://github.com/datapartyjs/rfparty-xyz) )

## Usage

rfparty-monitor is a tool for wireless situational awareness and debugging. its like a tricorder, for your wireless world.

 * [Setup](#installation)
 * Deploy sensor
 * Retrieve Logs & [Convert to GPX](#converting-nmea-to-gpx)
 * Visit [rfparty.xyz](https://rfparty.xyz)
 * Select monitor log
 * Select GPS track
 * Click 'load'
 * Party! 🎉
 * [Support](#follow-and-support)

## File Paths

 * `/data/rfparty/ble`
 * `/data/rfparty/gps`
 * `/data/rfparty/wifi`
 * `/data/rfparty/logs`
 * `/usr/bin/rfparty-info`
 * `/usr/bin/rfparty-monitor`
 * `/etc/systemd/system/rfparty-monitor.service`

## Installation


* `sudo ./scripts/install.sh`

###  Requirements

 * [Ubuntu 20.04](https://releases.ubuntu.com/20.04/) or debian equivalent
    * Packages: `build-essential bluetooth bluez bluez-hcidump libbluetooth-dev libudev-dev gpsd gpsd-clients gpsbabel python-gps wireless-tools aircrack-ng libpcap-dev`
    * `sudo ./scripts/install-requirements.sh`
 * [nodejs LTS 16.x](https://github.com/nodesource/distributions/blob/master/README.md)
 * USB GPS (optional)
 * Bluetooth dongle 
    * CSR 4.x work well
    * Raspi internal works well on ubuntu 18.04 but not 20.04
 * Wifi dongle supporting promiscuous mode
    * Alfa wifi work well

### Alternate GPS Source

Any smart phone our device capable of outputting GPX 1.0 is currently supported.

* Android
    * [Mendhak's GPX Logger](https://github.com/mendhak/gpslogger/blob/master/README.md#gpslogger----)
* iOS
    * [myTracks](https://itunes.apple.com/us/app/mytracks-the-gps-logger/id358697908?mt=8)



## Follow and Support

 * [Twitter](https://twitter.com/datapartydao)
 * [Buy it on Google Play](https://play.google.com/store/apps/details?id=xyz.dataparty.rfparty)
 * Donate 🤲
   * $eth - `0x430c1Bf9CbbbEA845651Ba1536d4B9795696dD5d`
   * $btc(segwit) - `bc1qgynk82txpsadmmzz043lc7edcxd4xl5v8qqr0z`
   * $btc(legacy) - `16wW7HaKvQfoWxZkFEPQysMnyNxjn8YNLN`
   * $usdt - `0x62E8a85670A375A3f32E01D71f42ce71d908417B`


## Roadmap 🗺️

 * Support PCAP 💾
   * Hidden Wifi AP
   * Wifi Clients
 * Improved error handling 🚧
 * Improve configuration 🛠️
 * Database optimization 👨🏿‍💻
   * High endurance deployments
   * Dynamic detail
   * Protocol filter
   * Running Statistics
 * Protocol Improvements 🔌
   * Bluetooth GATT logging
 * Improve location pipeline 🗺️
   * Log directly to GPX
   * Record GPX track to db
 * Realtime sharing 📡
   * Alerts
 * Wireless Intrussion Detection (WIDS) 🛡️
   * Common Wifi threats
   * BLE threats
 * Red teaming 🥷🏼
 * More frequencies, more protocols 👁️
   * LoRa
   * LoRaWAN
   * SDR tuning & capture
 * ... and much more ✨ 

## Troubleshooting

### Converting NMEA to GPX

 * `cd /data/gps`
 * `gpsbabel -i nmea -f "track.foo.nmea" -o gpx,gpxver=1.1 -F "track-foo.gpx"`

### Selecting Wifi Interface

In [./src/BLEMonitor.js](./src/BLEMonitor.js)

Set `SCANNING_WIFI_IFACE` to your desired wifi scanning interface for home detection.

### Promiscuous Wifi Interface

In [./scripts/start-snif.sh](./scripts/start-snif.sh) change the arodump commands to correctly select your desired promiscuous wifi interface
