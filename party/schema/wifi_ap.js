'use strict'


const ISchema = require('@dataparty/api/src/service/ischema')

const Helpers = require('./helpers')


class WifiAp extends ISchema {

  static get Type () { return 'wifi_ap' }

  static get Schema(){
    return {
      ...Helpers.WifiApStation
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


module.exports = WifiAp