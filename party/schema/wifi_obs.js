'use strict'


const ISchema = require('@dataparty/api/src/service/ischema')

const Helpers = require('./helpers')


class WifiObs extends ISchema {

  static get Type () { return 'wifi_obs' }

  static get Schema(){
    return {
      ...Helpers.WifiApObservation
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


module.exports = WifiObs