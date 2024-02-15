
const HCIBindings = require('@abandonware/noble/lib/hci-socket/bindings')
const Noble = require('@abandonware/noble/lib/noble')

/*const noble = new Noble(new HCIBindings({
  deviceId: 1,
  userChannel: true,
  extended: true
}));*/

const noble = new Noble(new HCIBindings({}))

//const noble = require('@abandonware/noble/with-custom-binding')({extended: true})
const ITask = require('@dataparty/api/src/service/itask')

const reach = require('../../src/utils/reach')

const moment = require('moment')

const debug = require('debug')('rfparty.task.ble-monitor')


class BleMonitorTask extends ITask {

  constructor({hostname, port, ...options}){
    super({
      name: BleMonitorTask.name,
      background: BleMonitorTask.Config.background,
      ...options
    })

    this.scanning = false
    this.resetTimer = null
    this.scanTimer = null
    this.scanIntervalMs = 60000

    this.packetCount = 0
    this.stationCount = 0
    this.duplicateCount = 0

    this.gpsdTask = null
    this.advMap = {}
  }

  static get Config(){
    return {
      background: true,
      autostart: true
    }
  }

  async exec(){
    debug('exec')

    let handle = this.detach()

    try{
      if(!this.gpsdTask){
        this.gpsdTask = this.context.serviceRunner.taskRunner.getTask('GpsdLoggerTask')
      }
      

      noble.on('warning', this.handleWarning)
      noble.on('scanStop', this.handleStopped)
      noble.on('discover', this.handleDeviceDiscovery)
      noble.on('stateChange', this.handleBleStateChange)

      if(this.scanTimer !== null){
        clearTimeout(this.scanTimer)
        this.scanTimer = null
      }

      debug('state', noble.state)

      await this.handleScanTimer()

      /*this.scanTimer = setInterval(async ()=>{
        
      }, this.scanIntervalMs)*/

      //await this.stopScan()
      //await this.startScan()
    }
    catch(err){
      debug('error starting', err)
    }

    return handle
  }

  handleScanTimer = async ()=>{
    debug('PROCESSED ', this.packetCount, '✉️ ', this.stationCount, '📡  ', 'duplicateCount=',this.duplicateCount)
    debug('scan interval - state = ',noble.state)


    if(noble.state == 'poweredOn' && this.scanning){
      debug('scan interval - stopping scan')
      await this.stopScan()
    }


    if(noble.state != 'poweredOn'){
      debug('skipping scan start, adapter not powered on')
      this.scanTimer = setTimeout(this.handleScanTimer, this.scanIntervalMs)
      return
    }

    debug('scan interval - starting scan')
    await this.startScan()
    debug('scan interval - scanning')


    this.scanTimer = setTimeout(this.handleScanTimer, this.scanIntervalMs)
  }

  async startScan(){
    debug('starting', (new Date()).toLocaleString())

    if(this.scanning){ return }

    if(noble.state != 'poweredOn'){
      throw new Error('not powered on')
    }

    this.scanning = true
    await noble.startScanningAsync(undefined, true)
    
    debug('started', (new Date()).toLocaleString())

    if(this.resetTimer != null){
      clearTimeout(this.resetTimer)
      this.resetTimer = null
      debug('reset cancelled')
    }
  }

  async stopScan(){
    debug('stopScan')
    if(this.resetTimer != null){
      clearTimeout(this.resetTimer)
      this.resetTimer = null
      debug('reset cancelled')
    }

    this.advMap = {}
    
    if(!this.scanning || noble.state != 'poweredOn'){ return }
    
    debug('stopping noble')
    this.scanning = false
    await noble.stopScanningAsync()

    debug('stopped', (new Date()).toLocaleString())
  }
 
  async stop(){
    debug('stopping', (new Date()).toLocaleString())

    if(this.scanTimer !== null){
      clearTimeout(this.scanTimer)
      this.scanTimer = null
    }

    await this.stopScan()

    noble.off('warning', this.handleWarning)
    noble.off('scanStop', this.handleStopped)
    noble.off('discover', this.handleDeviceDiscovery)
    noble.off('stateChange', this.handleBleStateChange)

    //this.backgroundResolve()
  }

  static get Name(){
    return 'ble-monitor'
  }

  static get Description(){
    return 'BLE Monitor'
  }



  handleWarning = (val)=>{
    debug('warning', val)
  } 

  handleStopped = async ()=>{
    debug("handle stopped BLE - ", (new Date()).toLocaleString())
    if(this.scanning == true){
    
      this.scanning = false
    
      debug('scheduling adapter reset - ', (new Date()).toLocaleString())
      
      if(this.resetTimer != null){ return }
     
      this.resetTimer = setTimeout(async ()=>{

        this.resetTimer = null

        if(this.scanning==true){
          debug('reset bailed, adapter already started', (new Date()).toLocaleString())
          return
        }

        //debug('reseting', (new Date()).toLocaleString())
        //noble.reset()

        if(noble.state == 'poweredOn'){
          await this.startScan()
        }
        debug('reset finished', (new Date()).toLocaleString())
      }, 3000)
      //await this.startScan()
    }
    else { debug('ignoring stop') }
      
  }
	
  	
  handleBleStateChange = async (state) => {
    debug('ble state changed: '+state, (new Date()).toLocaleString())

    if(this.failure){
      debug('FAIL SKIP')
      return
    }

    switch(state){
      case 'resetting':
        break;
      case 'poweredOn':
        await this.startScan()
        break
      case 'unknown':
      case 'poweredOff':

        

        if(this.resetTimer != null){
          clearTimeout(this.resetTimer)
          this.resetTimer = null
          debug('resetTimer cancelled')
        }

        if(this.scanTimer !== null){
          clearTimeout(this.scanTimer)
          this.scanTimer = null
          debug('scanInterval cancelled')
        }

        noble.off('warning', this.handleWarning)
        noble.off('scanStop', this.handleStopped)
        noble.off('discover', this.handleDeviceDiscovery)
        noble.off('stateChange', this.handleBleStateChange)

        //noble.reset()

        this.scanning = false

        await this.backgroundReject('ble adapter powered off')
      default:
        break
    }
  }


  handleDeviceDiscovery = async (device)=>{
    //debug(`device discovered: ${device.address} ${device.addressType} ${device.rssi} ${device.mtu} ${Object.keys(device)} ${JSON.stringify(device.advertisement)}`)


    //! device.advertisement.eir is Buffer
    
    let eirString64 = device.advertisement.eir.toString('base64')


    let now = moment()
    let heard = reach(this.advMap, `${device.address}.${eirString64}`)

    let createCacheEntry = ()=>{
      let devCache = reach(this.advMap, device.address)

      if(!devCache){
        this.advMap[device.address] = {}
      }

      this.advMap[device.address][eirString64] = [now, device.rssi, device.rssi]  //! timestamp, rssi_low, rssi_high
    }

    if(heard){

      // check if we heard within a scanInterval?

      //let diff = heard[0].diff( now )
      //if(diff < this.scanIntervalMs){
        // only store if rssi pushes power bounds up or down

        //if(device.rssi >= heard[1] && device.rssi <= heard[2]){
          //debug('\t','skip - within', device.address, heard[1], heard[2])
          this.duplicateCount++
          return
        //}

        this.advMap[device.address][eirString64] = [
          now,
          (device.rssi < heard[1]) ? device.rssi : heard[1],
          (device.rssi > heard[2]) ? device.rssi : heard[2]
        ]

        //debug('bounds push')

      /*} else {
        createCacheEntry()
      }*/
  
    } else {
      createCacheEntry()
    }


    debug(`device discovered: ${device.address} ${device.addressType} ${device.rssi} ${device.connectable} ${device.scannable} ${device.state} ${device.mtu} ${eirString64}`)
    //this.emit('address', device)
    

    
    const dev = {
      id: device.address,
      advertising: eirString64,
      rssi: device.rssi
    }

    let lastLocation = undefined


    if(this.gpsdTask){
      lastLocation = this.gpsdTask.lastLocation
    }
    
    debug(lastLocation)

    const BleAdv = this.context.party.factory.getFactory('ble_adv')
    const BleStation = this.context.party.factory.getFactory('ble_station')

    let deviceDoc = await BleAdv.indexBleDevice(this.context.party, dev, lastLocation)
    debug('deviceDoc')
    let station = await BleStation.indexBleStation(this.context.party, deviceDoc)
    debug('stationDoc')

    if(station.data.timebounds.first == station.data.timebounds.last){
      this.stationCount++

      debug(station.data)
      //this.emit('station_count', this.stationCount)
    }

    this.packetCount++
    //this.emit('packet_count', this.packetCount)
  }
}

module.exports = BleMonitorTask
