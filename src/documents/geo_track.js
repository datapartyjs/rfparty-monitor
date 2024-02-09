const moment = require('moment')

const debug=require('debug')('rfparty.geo_track')

const Dataparty = require( '@dataparty/api' )

const GeoUtils = require('../utils/geo-utils')

const GeoPoint = require('./geo_point')

module.exports = class GeoTrackDocument extends Dataparty.IDocument {
  constructor({ party, type, id, data }) {
    super({ party, type, id, data })
    debug("instantiated - ", this.id)
  }

  static async indexGeoPoint(party, point){

    let prev = moment().subtract(15, 'minutes')

    let tracks = (await party.find()
      .type('geo_track')
      .where('timebounds.first').gt(prev.valueOf())
      //.sort('-timebounds.first')
      .limit(1)
      .exec())

    let track = tracks[0]

    if(!track){
      debug('found tracks', tracks)
      track = await GeoTrackDocument.createFromGeoPoint(party, point)
      debug('created', track)

      await Promise.all([
        track.save(),
        GeoPoint.indexGeoPoint(party, point)
      ])
  
      return track
    }

    debug('indexGeoPoint', track)

    track.data.geobounds = GeoUtils.updatGeoBoundsByPoint(track.data.geobounds, point)
    track.data.location = GeoUtils.updateLocationBounds(track.data.location, point)
    track.data.timebounds = GeoUtils.updateTimebounds(track.data.timebounds, point.time)
    track.data.points++

    await Promise.all([
      track.save(),
      GeoPoint.indexGeoPoint(party, point)
    ])

    return track
  }

  static get DocumentSchema(){
    return 'geo_track'
  }

  static async createFromGeoPoint(party, point){
    debug('create')

    const now = moment().valueOf()

    const loc = {
      lat: point.latitude, lon: point.longitude
    }

    return await party.createDocument('geo_track', {
      created: now,

      timebounds: { first: now, last: now },

      location: { first: loc, last: loc },

      geobounds: { min: loc, max: loc },

      points: 1

    })
  }
}