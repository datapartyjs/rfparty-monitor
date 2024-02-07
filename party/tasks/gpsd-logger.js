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

    debug('new')

    this.hostname = !options.hostname ? 'localhost' : options.hostname
    this.port = !options.port ? 2947 : options.post

    this.lastTPVFix = null

    this.gpsdListner = new gpsd.Listener({
      port: this.port,
      hostname: this.hostname,
      logger:  {
          info: console.log,
          warn: console.warn,
          error: console.error
      },
      parse: true
    })
    
    debug('newed')
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

    const GeoTrack = this.context.party.factory.getFactory('geo_track')

    let track = await GeoTrack.indexGeoPoint(this.context.party, location)

    debug('logged point')
  }
 
  async exec(){
    debug('exec')

    this.gpsdListner.on('TPV', this.onTPV.bind(this))

    await this.connect()

    debug('connected')

    this.gpsdListner.watch({
      class: 'WATCH',
      json: true,
      nmea: false
    })

    return this.detach()
  }
 
  async stop(){
    debug('stopping')
    await this.disconnect()
    debug('stopped')
  }

  static get Name(){
    return 'gpsd-logger'
  }

  static get Description(){
    return 'GPSd Logger'
  }
}

module.exports = GpsdLoggerTask