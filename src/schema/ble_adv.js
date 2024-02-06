'use strict'

const ISchema = require('@dataparty/api/src/service/ischema')


const Helpers = require('./helpers')


class BleAdv extends ISchema {

  static get Type () { return 'ble_adv' }

  static get Schema(){
    return {
      packet: Helpers.BlePacket,

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


module.exports = BleAdv