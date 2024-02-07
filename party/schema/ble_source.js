'use strict'

const ISchema = require('@dataparty/api/src/service/ischema')

const Utils = ISchema.Utils


class BleSource extends ISchema {

  static get Type () { return 'ble_source' }

  static get Schema(){
    return {
      created: Utils.created,
      info: {
        uuid: {type: String, index: true},
        serial: {type: String, index: true},
        model: String,
        platform: String,
        sdkVersion: String,
        manufacturer: String,
        cordova: String,
        version: String
      }
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


module.exports = BleSource