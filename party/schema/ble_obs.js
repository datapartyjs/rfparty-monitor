'use strict'

const ISchema = require('@dataparty/api/src/service/ischema')


const Helpers = require('./helpers')


class BleObservation extends ISchema {

  static get Type () { return 'ble_obs' }

  static get Schema(){
    return Helpers.BleObservation
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


module.exports = BleObservation