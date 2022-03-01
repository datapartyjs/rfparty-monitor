# rfparty-monitor

[rfparty.xyz](https://rfparty.xyz)

`sense, plan, party 🤘🏿` 

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

 * /data
   * ble
   * gps
   * wifi
   * logs
 * /usr/bin/
   * rfparty-info
   * rfparty-monitor
 * /etc/systemd/system/rfparty-monitor.service

## Installation

`sudo ./scripts/install-requirements.sh`

###  Requirements

 * [Ubuntu 20.04](https://releases.ubuntu.com/20.04/) or debian equivalent
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

 * [Twitter](https://twitter.com/datapartyjs)
 * Donate 🤲
   * $eth - `0x430c1Bf9CbbbEA845651Ba1536d4B9795696dD5d`
   * $btc(segwit) - `bc1qgynk82txpsadmmzz043lc7edcxd4xl5v8qqr0z`
   * $btc(legacy) - `16wW7HaKvQfoWxZkFEPQysMnyNxjn8YNLN`
   * $usdt - `0xF790F8Ce7E6bcdD2aF96De59d342511734B29bB0`
   * $xmr - `4BzzF8DwBc9Mik5B2rhKJLGrHB7ch3p3cQp7bCD16uRWHbiSpZUPfYEg62jgNKxkdjSuR4iqoxKa3Eb2y5uP7vZHSbdSY7AfsjeQwVLFKg`


## Roadmap 🗺️

 * Improved error handling
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
 * Support PCAP
   * Hidden Wifi AP
   * Wifi Clients
   * Traffic Metric
 * Realtime sharing 📡
   * Alerts
 * Wirless Intrussion Detection (WIDS)
   * Common Wifi threats
   * Emerging BLE threats
 * More frequencies, more protocols
   * LoRa
   * LoRaWAN
   * SDR tuning & capture
 * ... and much more ✨ 


## Converting NMEA to GPX

 * `cd /data/gps`
 * `gpsbabel -i nmea -f "track.foo.nmea" -o gpx,gpxver=1.1 -F "track-foo.gpx"`