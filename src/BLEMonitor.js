#!/usr/bin/env node
'use strict';

const EventEmitter = require('events')
const noble = require('@abandonware/noble')
const moment = require('moment')


const HomeDetector = require('./home-detect')

const Loki = require('lokijs')
const LokiFS = Loki.LokiFsAdapter
const LSFA = require('lokijs/src/loki-fs-structured-adapter')


const SCANNING_WIFI_IFACE="wlan0"


/** 
 * List of known home zone bssid's for automatic mobile/stationary detection
 * Anytime a majority of listed APs are seen a home_state record will be created indicating the time the sensor left home.
 */

const BSSID = [
  ''
]

const dateStamp = moment().format('DD-MM-YYYY')
const filePath = '/data/rfparty/ble/log-' + dateStamp + '.db'

console.log('log path'+filePath)

let db = new Loki(filePath, {
  adapter: new LokiFS
})

class BLEMonitor extends EventEmitter {
  constructor(options){
    super()
    options = options || {}
    
    this.scanning = false

    this.resetTimer = null

    noble.on('warning', this.handleWarning.bind(this))
    noble.on('scanStop', this.handleStopped.bind(this))
    noble.on('discover', this.handleDeviceDiscovery.bind(this))
    noble.on('stateChange', this.handleBleStateChange.bind(this))
  }

  async stop(){
    console.log('stopping', (new Date()).toLocaleString())

    if(this.resetTimer != null){
      clearTimeout(this.resetTimer)
      this.resetTimer = null
      console.log('reset cancelled')
    }
    
    if(!this.scanning){ return }    
    
    this.scanning = false
    await noble.stopScanningAsync()

    console.log('stopped', (new Date()).toLocaleString())
    
  }

  async start(){
    console.log('starting', (new Date()).toLocaleString())

    if(this.scanning){ return }

    this.scanning = true
    await noble.startScanningAsync(undefined, false)
    
    console.log('started', (new Date()).toLocaleString())

    if(this.resetTimer != null){
      clearTimeout(this.resetTimer)
      this.resetTimer = null
      console.log('reset cancelled')
    }
  }

  handleWarning(){

  } 

  async handleStopped(){
    console.log("handle stopped BLE - ", (new Date()).toLocaleString())
    if(this.scanning == true){
    
      this.scanning = false
    
      console.log('scheduling adapter reset - ', (new Date()).toLocaleString())
      
      if(this.resetTimer != null){ return }
     
      this.resetTimer = setTimeout(async ()=>{

      this.resetTimer = null

        if(this.scanning==true){
          console.log('reset bailed, adapter already started', (new Date()).toLocaleString())
          return
        }

        console.log('reseting', (new Date()).toLocaleString())
        // noble.reset()
        await this.start()
        console.log('reset finished', (new Date()).toLocaleString())
      }, 3000)
      //await this.start()
    }
    else { console.log('ignoring stop') }
      
  }
  	
  	
  	
  async handleBleStateChange(state){
    console.log('ble state changed: '+state, (new Date()).toLocaleString())

    switch(state){
      case 'resetting':
        break;
      case 'poweredOn':
        await this.start()
        break
      case 'poweredOff':
        process.exit(-2)
      default:
        break
    }

    /*
    if(noble.state == 'poweredOn'){
      noble.startScanning()
      this.scanning = true
    }
    else{
      noble.stopScanning()
    }*/
  }


  handleDeviceDiscovery(device){
    //console.log(`device discovered: ${device.address} ${device.rssi}`)
    this.emit('address', device)
  }
}


let uniques = 0

db.loadDatabase({}, async () =>{
  console.log('on db load')
  let bleColl = db.getCollection('ble')
  let wifiColl = db.getCollection('wifi')
  let homeStateColl = db.getCollection('homeState')

  if(!bleColl){ bleColl = db.addCollection('ble') }
  if(!wifiColl){ wifiColl = db.addCollection('wifi') }
  if(!homeStateColl){ homeStateColl = db.addCollection('homeState') }

  let monitor = new BLEMonitor()
  let hasChanges = false;

  let lastIsHome = null
  let homeDetect = new HomeDetector({iface:SCANNING_WIFI_IFACE||'wlan0', knownBSSID:BSSID})


  setInterval(()=>{
    hasChanges = true
    let coll = db.getCollection('homeState')

    console.log('log is-home', homeDetect.isHome)
    coll.insert({
      timestamp: Date.now(),
      isHome: homeDetect.isHome
    })

  }, 600000)


  homeDetect.on('is-home', isHome => {

    console.log('wifi scan saw', homeDetect.lastScan.length)
    if(isHome != lastIsHome ){

      hasChanges = true
      let coll = db.getCollection('homeState')

      console.log('is-home', isHome)
      coll.insert({
        timestamp: Date.now(),
        isHome: isHome
      })



      lastIsHome = isHome
    }
  })

  homeDetect.on('network', network=>{
    hasChanges = true
    let coll = db.getCollection('wifi')
    let doc = coll.findOne({'mac': network.mac})

    if(!doc){
      doc = {
        mac: network.mac,
        ssid: network.ssid,
        bssid: network.bssid,
        mode: network.mode,
        security: network.security,
        security_flags: network.security_flags,
        seen: [{
          channel: network.channel,
          frequency: network.frequency,
          signal_level: network.signal_level,
          timestamp: Date.now()
        }]
      }

      coll.insert(doc)
    }
    else{

      doc.seen.push({
        channel: network.channel,
        frequency: network.frequency,
        signal_level: network.signal_level,
        timestamp: Date.now()
      })

      coll.update(doc)
    }
  })

  await homeDetect.start()

  setInterval(()=>{
    if(hasChanges){
      hasChanges = false
      db.saveDatabase(()=>{
        console.log('saved db with uniques', uniques)
      })
    }
    else{
      console.log('no changes need saving')
    }
  }, 120000)


  setInterval(async ()=>{
    console.log('scan interval - state = ',noble.state)
    console.log('scan interval - stopping scan')
    await monitor.stop()
    console.log('scan interval - starting scan')
    await monitor.start()
    console.log('scan interval - scanning')
  }, 30000)

  monitor.on('address',(device)=>{
    hasChanges = true
    let coll = db.getCollection('ble')

    let addrDoc = coll.findOne({'address': device.address})


    if(!addrDoc){
      console.log('new device:', device.address, device.connectable, device.state, Object.keys(device), device.services, '\tadv:', device.advertisement)
      uniques++
      addrDoc = {
        mtu: device.mtu,
        state: device.state,
        address: device.address,
        addressType: device.addressType,
        connectable: device.connectable,
        advertisement: device.advertisement,

        seen: [
          {
            timestamp: Date.now(),
            rssi: device.rssi
          }
        ]
      }

      coll.insert(addrDoc)
    }
    else{

      const firstSeen = addrDoc.seen[0].timestamp

      const firstSeenStr = moment(firstSeen).fromNow()

      console.log('update device:', device.address,'first-seen:',firstSeenStr, 'seen:', addrDoc.seen.length, 'rssi:', device.rssi)
      addrDoc.seen.push({
        timestamp: Date.now(),
        rssi: device.rssi
      })
      coll.update(addrDoc)
    }
  })

});
module.exports = BLEMonitor
