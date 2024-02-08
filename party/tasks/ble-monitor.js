const noble = require('@abandonware/noble')
const ITask = require('@dataparty/api/src/service/itask')

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
    this.scanInterval = null
    this.scanIntervalMs = 10000 //! @hack
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

      noble.on('warning', this.handleWarning)
      noble.on('scanStop', this.handleStopped)
      noble.on('discover', this.handleDeviceDiscovery)
      noble.on('stateChange', this.handleBleStateChange)

      if(this.scanInterval !== null){
        clearInterval(this.scanInterval)
        this.scanInterval = null
      }

      this.scanInterval = setInterval(async ()=>{
        debug('scan interval - state = ',noble.state)
        debug('scan interval - stopping scan')
        await this.stopScan()

        if(noble.state != 'poweredOn'){
          debug('skipping scan start, adapter not powered on')
          return
        }

        debug('scan interval - starting scan')
        await this.startScan()
        debug('scan interval - scanning')
      }, this.scanIntervalMs)

      //await this.stopScan()
      //await this.startScan()
    }
    catch(err){
      debug('error starting', err)
    }

    return handle
  }

  async startScan(){
    debug('starting', (new Date()).toLocaleString())

    if(this.scanning){ return }

    if(noble.state != 'poweredOn'){
      throw new Error('not powered on')
    }

    this.scanning = true
    await noble.startScanningAsync(undefined, false)
    
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
    
    if(!this.scanning || noble.state != 'poweredOn'){ return }
    
    debug('stopping noble')
    this.scanning = false
    await noble.stopScanningAsync()

    debug('stopped', (new Date()).toLocaleString())
  }
 
  async stop(){
    debug('stopping', (new Date()).toLocaleString())

    if(this.scanInterval !== null){
      clearInterval(this.scanInterval)
      this.scanInterval = null
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

        debug('reseting', (new Date()).toLocaleString())
        noble.reset()

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

        if(this.scanInterval !== null){
          clearInterval(this.scanInterval)
          this.scanInterval = null
          debug('scanInterval cancelled')
        }

        noble.off('warning', this.handleWarning)
        noble.off('scanStop', this.handleStopped)
        noble.off('discover', this.handleDeviceDiscovery)
        noble.off('stateChange', this.handleBleStateChange)

        noble.reset()

        await this.backgroundReject('ble adapter powered off')
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


  handleDeviceDiscovery = (device)=>{
    //debug(`device discovered: ${device.address} ${device.addressType} ${device.rssi} ${device.advertisement}`)


    //! device.advertisement.eir is Buffer

    debug(`device discovered: ${device.address} ${device.addressType} ${device.rssi} ${device.connectable} ${device.scannable} ${device.state} ${device.mtu} ${device.services}`)
    //this.emit('address', device)
  }
}

module.exports = BleMonitorTask