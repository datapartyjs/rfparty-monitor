'use strict';

const EventEmitter = require('events')
const noble = require('noble')

const Loki = require('lokijs')
const LokiFS = Loki.LokiFsAdapter

console.log(LokiFS)

let db = new Loki('log.db', {
  /*adapter: LokiFS,
  //autoload: true,
  autoloadCallback : dbLoadHandler,
  autosave: true,
  autosaveInterval: 10000*/
})

class BLEMonitor extends EventEmitter {
  constructor(options){
    super()
    options = options || {}
    noble.on('discover', this.handleDeviceDiscovery.bind(this))
    noble.on('stateChange', this.handleBleStateChange.bind(this))
  }

  stop(){
    return new Promise((resolve, reject)=>{
      noble.stopScanning(resolve)
    })
  }

  start(){
    return new Promise((resolve, reject)=>{
      noble.startScanning(undefined, undefined, resolve)
    })
  }

  handleBleStateChange(state){
    console.log('state changed: '+state)

    if(noble.state == 'poweredOn'){
      noble.startScanning()
    }
    else{
      noble.stopScanning()
    }
  }


  handleDeviceDiscovery(device){
    console.log(`device discovered: ${device.address} ${device.rssi}`)
    this.emit('address', device)
  }
}



db.loadDatabase({}, function() {
  let bleColl = db.getCollection('ble')

  if(!bleColl){
    bleColl = db.addCollection('ble')
  }

  let monitor = new BLEMonitor()
  let hasChanges = false;

  setInterval(()=>{
    if(hasChanges){
      hasChanges = false
      db.saveDatabase(()=>{
        console.log('saved db')
      })
    }
    else{
      console.log('no changes need saving')
    }
  }, 10000)

  setInterval(()=>{
    console.log('stopping scan')
    monitor.stop().then(()=>{
      console.log('starting scan')
      monitor.start().then(()=>{
        console.log('scanning')
      })
    })
  }, 300000)

  monitor.on('address',(device)=>{
    hasChanges = true
    let addrDoc = bleColl.findOne({'address': device.address})

    if(!addrDoc){
      addrDoc = {
        address: device.address,
        seen: [
          {
            timestamp: Date.now(),
            rssi: device.rssi
          }
        ]
      }

      bleColl.insert(addrDoc)
    }
    else{
      addrDoc.seen.push({
        timestamp: Date.now(),
        rssi: device.rssi
      })
      bleColl.update(addrDoc)
    }
  })

});
module.exports = BLEMonitor
