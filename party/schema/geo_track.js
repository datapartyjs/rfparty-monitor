'use strict'

const ISchema = require('@dataparty/api/src/service/ischema')


const Helpers = require('./helpers')


class GeoTrack extends ISchema {

  static get Type () { return 'geo_track' }

  static get Schema(){
    return Helpers.GeoTrackInfo
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


module.exports = GeoTrack