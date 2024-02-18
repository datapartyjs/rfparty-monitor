
const HCIBindings = require('@abandonware/noble/lib/hci-socket/bindings')
const Noble = require('@abandonware/noble/lib/noble')

const DeltaTime = require('../../src/utils/delta-time')

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

const PENDING_LIMIT = 1

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
    this.observationIntervalMs = 60000
    this.drainPendingIntervalMs = 800

    this.drainingPending = false
    this.pendingCount = 0
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

      debug('noble state', noble.state)

      await this.handleScanTimer()
    }
    catch(err){
      debug('error starting', err)
    }

    return handle
  }

  handleScanTimer = async ()=>{
    debug('PROCESSED ', this.packetCount, '✉️ ', this.stationCount, '📡  ', 'duplicateCount=',this.duplicateCount, ' pending', this.pendingCount, ' cached', Object.keys(this.advMap).length,  (new Date()).toLocaleString())
    debug('scan interval - state = ',noble.state)

    if(noble.state == 'poweredOn' && this.scanning){
      debug('scan interval - stopping scan',  (new Date()).toLocaleString())
      await this.stopScan()
    }

    if(this.pendingCount > PENDING_LIMIT){
      this.drainingPending = true

      debug('draining pending')

      this.scanTimer = setTimeout(this.handleScanTimer, this.drainPendingIntervalMs)
      return
    }
    else{
      this.drainingPending = false
    }


    if(noble.state != 'poweredOn'){
      debug('skipping scan start, adapter not powered on')
      this.scanTimer = setTimeout(this.handleScanTimer, this.scanIntervalMs)
      return
    }

    debug('cleaning cache')

    let now = moment()

    for(let dev in this.advMap){
      //debug('\t', dev)

      for(let eir in this.advMap[dev]){

        
        let heard = this.advMap[dev][eir]
        let diff = now.diff( heard[3] )
        
        //debug('\t\t', eir, ' diff', diff)

        if(diff >= this.observationIntervalMs){
          //debug('delete')
          delete this.advMap[dev][eir]
        }

      }

      let devNode = this.advMap[dev]

      if(Object.keys(devNode).length < 1){
        //debug('delete')
        delete this.advMap[dev]
      }
    }

    debug('scan interval - starting scan', (new Date()).toLocaleString())
    await this.startScan()
    debug('scan interval - scanning',  (new Date()).toLocaleString())


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

    //this.advMap = {}
    
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

    this.pendingCount++

    //! device.advertisement.eir is Buffer
    

    let cacheCheckTime = new DeltaTime().start()
    
    let eirString64 = device.advertisement.eir.toString('base64')


    let now = moment()
    let heard = reach(this.advMap, `${device.address}.${eirString64}`)

    let createCacheEntry = ()=>{
      let devCache = reach(this.advMap, device.address)

      if(!devCache){
        this.advMap[device.address] = {}
      }

      let delayMs = Math.round(Math.random() * (this.scanIntervalMs*0.3))

      this.advMap[device.address][eirString64] = [now.add(delayMs, 'ms'), device.rssi, device.rssi, now]  //! cache_timestamp, rssi_low, rssi_high, last_observation
    }

    if(heard){

      // check if we heard within a scanInterval?

      let diff = now.diff( heard[3] )
      if(diff < this.observationIntervalMs){
        // only store if rssi pushes power bounds up or down

        //if(device.rssi >= heard[1] && device.rssi <= heard[2]){
          //debug('\t','skip - within', device.address, heard[1], heard[2])
          this.duplicateCount++
          this.pendingCount--
          return
        //}

        this.advMap[device.address][eirString64] = [
          now,
          (device.rssi < heard[1]) ? device.rssi : heard[1],
          (device.rssi > heard[2]) ? device.rssi : heard[2]
        ]

        //debug('bounds push')

      } else {
        //debug('delete', device.address)
        delete this.advMap[device.address]
        createCacheEntry()
      }
  
    } else {
      createCacheEntry()
    }
  
    cacheCheckTime.stop()

    let factoryTime = new DeltaTime().start()


    //debug(`device discovered: ${device.address} ${device.addressType} ${device.rssi} ${device.connectable} ${device.scannable} ${device.state} ${device.mtu} ${eirString64}`)
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
    
    //debug(lastLocation)

    const BleAdv = this.context.party.factory.getFactory('ble_adv')
    const BleStation = this.context.party.factory.getFactory('ble_station')

    factoryTime.stop()

    let deviceDocTime = new DeltaTime().start()
    let deviceDoc = await BleAdv.indexBleDevice(this.context.party, dev, lastLocation)
    deviceDocTime.stop()

    //debug('deviceDoc')

    let stationDocTime = new DeltaTime().start()
    let station = await BleStation.indexBleStation(this.context.party, deviceDoc)
    stationDocTime.stop()

    //debug('stationDoc')

    const latencyReport = {
      cache: cacheCheckTime.deltaMs,
      factory: factoryTime.deltaMs,
      device: deviceDocTime.deltaMs,
      station: stationDocTime.deltaMs,
      cached: Object.keys(this.advMap).length
    }

    let isNew = false

    if(station.data.timebounds.first == station.data.timebounds.last){
      this.stationCount++

      isNew = true

      //debug(station.data)
      //this.emit('station_count', this.stationCount)
    }

    this.pendingCount--
    latencyReport.isNew = isNew
    latencyReport.pending = this.pendingCount

    //debug('latency - ', dev.id, JSON.stringify(latencyReport, null, 2))

    this.packetCount++
    //this.emit('packet_count', this.packetCount)
  }
}

module.exports = BleMonitorTask
