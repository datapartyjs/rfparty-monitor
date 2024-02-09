'use strict'

const ISchema = require('@dataparty/api/src/service/ischema')


const Helpers = require('./helpers')


class GeoPoint extends ISchema {

  static get Type () { return 'geo_pt' }

  static get Schema(){
    return Helpers.GeoPointIndexed
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


module.exports = GeoPoint