const debug=require('debug')('rfparty.geo_point')

const Dataparty = require( '@dataparty/api' )

module.exports = class GeoPointDocument extends Dataparty.IDocument {
  constructor({ party, type, id, data }) {
    super({ party, type, id, data })
    debug("instantiated - ", this.id)
  }

  static async indexGeoPoint(party, point){

    debug('create', point)

    let pointDoc = await party.createDocument('geo_pt', point)
    await pointDoc.save()

    return pointDoc
  }

  static get DocumentSchema(){
    return 'geo_pt'
  }
}