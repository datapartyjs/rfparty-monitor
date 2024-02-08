const DatapartySrv = require('@dataparty/api')
const debug = require('debug')('rfpartyd.service')

const Path = require('path')

class RfpartyService extends DatapartySrv.IService {
  constructor(opts){
    super(opts)

    this.addMiddleware(DatapartySrv.middleware_paths.pre.decrypt)
    this.addMiddleware(DatapartySrv.middleware_paths.pre.validate)

    this.addMiddleware(DatapartySrv.middleware_paths.post.validate)
    this.addMiddleware(DatapartySrv.middleware_paths.post.encrypt)

    this.addEndpoint(DatapartySrv.endpoint_paths.identity)
    this.addEndpoint(DatapartySrv.endpoint_paths.version)

    this.addSchema(Path.join(__dirname, '../party/schema/ble_adv.js'))
    this.addSchema(Path.join(__dirname, '../party/schema/ble_obs.js'))
    this.addSchema(Path.join(__dirname, '../party/schema/ble_source.js'))
    this.addSchema(Path.join(__dirname, '../party/schema/ble_station.js'))
    this.addSchema(Path.join(__dirname, '../party/schema/geo_point.js'))
    this.addSchema(Path.join(__dirname, '../party/schema/geo_track.js'))


    
    this.addTask(Path.join(__dirname, '../party/tasks/gpsd-logger.js'))
    this.addTask(Path.join(__dirname, '../party/tasks/ble-monitor.js'))

    /*
    
    this.addTask(Path.join(__dirname, '../party/tasks/lora-baseband-serial-rn2xxx.js'))
    this.addTask(Path.join(__dirname, '../party/tasks/wifi-monitor.js'))
    this.addTask(Path.join(__dirname, '../party/tasks/wifi-ap-monitor.js'))
    */

  }

}

module.exports = RfpartyService