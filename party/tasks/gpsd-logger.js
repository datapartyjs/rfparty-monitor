const gpsd = require('node-gpsd')
const ITask = require('@dataparty/api/src/service/itask')

const moment = require('moment')

const debug = require('debug')('rfparty.task.gpsd-logger')


class GpsdLoggerTask extends ITask {

  constructor({hostname, port, ...options}){
    super({
      name: GpsdLoggerTask.name,
      background: GpsdLoggerTask.Config.background,
      ...options
    })

    this.disconnected = false
    this.hostname = !options.hostname ? 'localhost' : options.hostname
    this.port = !options.port ? 2947 : options.post

    this.lastTPVFix = null
    this.lastLocation = undefined

    this.gpsdListner = new gpsd.Listener({
      port: this.port,
      hostname: this.hostname,
      logger:  {
          info: ()=>{},
          warn: debug,
          error: debug
      },
      parse: true
    })
    


    this.gpsdListner.on('TPV', this.onTPV.bind(this))
    this.gpsdListner.on('disconnected', this.handleDisconnect.bind(this))
    this.gpsdListner.on('error.connection', this.handleDisconnect.bind(this))

  }

  static get Config(){
    return {
      background: true,
      autostart: true
    }
  }

  async connect(){
    await new Promise((resolve,reject)=>{
        this.gpsdListner.connect(resolve)
    })
  }

  async disconnect(){
    await new Promise((resolve,reject)=>{
        this.gpsdListner.disconnect(resolve)
    })
  }

  async onTPV(data){



    if(data.mode != 2 && data.mode != 3){
      return
    }

    if(!data.time){
      return
    }

    if(!this.lastTPVFix){
      this.lastTPVFix = data      
    } else if(data.time == this.lastTPVFix.time){
      return
    }

    debug('tpv (', data.lat, ',', data.lon, ')')
    debug('last=',this.lastTPVFix.time, ' now=',data.time)
    debug(data)

    this.lastTPVFix = data
    

    const location = {
      time: moment(data.time).valueOf(),
      accuracy: data.eph,
      altitude: data.altHAE,
      bearing: data.track,
      latitude: data.lat,
      longitude: data.lon,
      speed: data.speed,

      provider: 'gpsd'
    }

    this.lastLocation = location

    const GeoTrack = this.context.party.factory.getFactory('geo_track')

    let track = await GeoTrack.indexGeoPoint(this.context.party, location)

    debug('logged point')
  }

  handleDisconnect(){
    if(this._cancel){ return }
    if(this.disconnected){ return }

    this.disconnected = true
    debug('disconnected')

    this.backgroundReject('gpsd disconnected')
  }
 
  async exec(){
    debug('exec')

    let handle = this.detach()

    try{

      debug('connecting')
      this.disconnected = false
      this.connect()
      
      this.gpsdListner.watch({
        class: 'WATCH',
        json: true,
        nmea: false
      })
    }
    catch(err){
      debug('error starting', err)
    }

    return handle
  }
 
  async stop(){

    debug('stopping')
    await this.disconnect()
    debug('stopped')
    this.backgroundResolve()
  }

  static get Name(){
    return 'gpsd-logger'
  }

  static get Description(){
    return 'GPSd Logger'
  }
}

module.exports = GpsdLoggerTask