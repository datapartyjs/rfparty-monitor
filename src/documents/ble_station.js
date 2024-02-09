const md5 = require('md5')
const moment = require('moment')
const debug=require('debug')('rfparty.ble_station')

const Dataparty = require( '@dataparty/api' )

const GeoUtils = require('../utils/geo-utils')

module.exports = class BleStationDocument extends Dataparty.IDocument {
  constructor({ party, type, id, data }) {
    super({ party, type, id, data });
    debug("instantiated - ", this.id);

  }

  static async indexBleStation(party, bleAdv){


    let stations = (await party.find()
      .type('ble_station')
      .where('address').equals(bleAdv.data.address.toLowerCase())
      .limit(1)
      .exec())

    let bleStationDoc = stations[0]

    if(!bleStationDoc){
      bleStationDoc = await BleStationDocument.createFromBleAdv(party, bleAdv)
      debug('created', bleStationDoc.data)

      await bleStationDoc.save()

      return bleStationDoc
    }

    debug('indexBleStation', bleStationDoc.data)

    const lastLoc = !bleAdv.data.location.last ? undefined : {
      latitude: bleAdv.data.location.last.lat,
      longitude: bleAdv.data.location.last.lon
    }

    bleStationDoc.data.geobounds = GeoUtils.updatGeoBoundsByGeoBounds(bleStationDoc.data.geobounds, bleAdv.data.geobounds)
    bleStationDoc.data.location = GeoUtils.updateLocationBounds(bleStationDoc.data.location, lastLoc)
    bleStationDoc.data.timebounds = GeoUtils.updateTimebounds(bleStationDoc.data.timebounds, bleAdv.data.timebounds.last)
    bleStationDoc.data.best = GeoUtils.updateBestRssi(bleStationDoc.data.best, bleAdv.data.best)
    bleStationDoc.data.worst = GeoUtils.updateWorstRssi(bleStationDoc.data.worst, bleAdv.data.worst)

    await bleStationDoc.save()

    return bleStationDoc
  }

  static get DocumentSchema(){
    return 'ble_station'
  }

  static async createFromBleAdv(party, bleAdv){
    debug('create')

    const now = moment().valueOf()

    return await party.createDocument('ble_station', {
      address: bleAdv.data.address.toLowerCase(),
      created: now,

      timebounds: bleAdv.data.timebounds,
      location: bleAdv.data.location,
      geobounds: bleAdv.data.geobounds,
    
      best: bleAdv.data.best,
      worst: bleAdv.data.worst,

      summary: bleAdv.data.packet.parsed
    })
  }
}