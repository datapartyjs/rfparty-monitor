const debug=require('debug')('rfparty.ble_obs')

const Dataparty = require( '@dataparty/api' )


module.exports = class BleObsDocument extends Dataparty.IDocument {
  constructor({ party, type, id, data }) {
    super({ party, type, id, data });
    debug("instantiated - ", this.id);

  }

  static async indexBleObs(party, {rssi,time,hash}){

    const obs = {
      rssi, time, hash
    }

    let obsDoc = await party.createDocument('ble_obs', obs)

    await obsDoc.save()

    return obsDoc
  }

  static get DocumentSchema(){
    return 'ble_obs'
  }
}