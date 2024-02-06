'use strict'


const ISchema = require('@dataparty/api/src/service/ischema')

const Helpers = require('./helpers')


class BleStation extends ISchema {

  static get Type () { return 'ble_station' }

  static get Schema(){
    return {
      summary: {}

      ...Helpers.BleStationInfo
      
    }
  }

  static setupSchema(schema){
    return schema
  }

  static permissions (context) {
    return {
      read: true,
      new: true,
      change: true
    }
  }
}


module.exports = BleStation