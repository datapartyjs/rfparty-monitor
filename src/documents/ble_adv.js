const moment = require('moment')

const md5 = require('md5')
const debug=require('debug')('rfparty.ble_adv')
const reach = require('../utils/reach')

const Dataparty = require( '@dataparty/api' )

const BleObs = require('./ble_obs')

const GeoUtils = require('../utils/geo-utils')

const {GapParser} = require('../parsers/gap-parser')
const AppleContinuity = require('../parsers/apple-continuity')
const {UUIDParser} = require('../parsers/uuid-parser')

module.exports = class BleAdvDocument extends Dataparty.IDocument {
  constructor({ party, type, id, data }) {
    super({ party, type, id, data });
    debug("instantiated - ", this.id);

  }

  parsePacket(){

    const gapFields = GapParser.parseBase64String(this.data.packet.base64)
    const uuids = GapParser.getUuids(gapFields)
    const gapObj = GapParser.toObject(gapFields)
    const serviceData = GapParser.getServiceData(gapObj)

    const uuidSearch = UUIDParser.lookupDeviceUuids(uuids)

    let product = null

    if(uuidSearch.results){
      for(let result of uuidSearch.results){
        if(result && result.indexOf('Product') != -1){
          product = result
        }
      }
    }

    let company = null
    let companyCode = null
    let appleContinuity = undefined
    if(reach(gapObj, 'ManufacturerData.0.value')){
      const manuData = Buffer.from(gapObj.ManufacturerData[0].value, 'hex')
      companyCode = manuData.subarray(0, 2).reverse().toString('hex')
      company = UUIDParser.lookupDeviceCompany(companyCode)

      if(companyCode == '004c'){
        appleContinuity = AppleContinuity.parse(manuData)
      }
    }

    let txpower = undefined
    if(reach(gapObj, 'TxPower.0.value')){
      const power = Buffer.from(gapObj.TxPower[0].value,'hex')
      txpower = power.readInt8(0)
    }

    this.data.packet.parsed = {
      gapTypes: Object.keys(gapObj),
      gapFields,
      hasUnknownService: uuids.length > 0 ? (uuidSearch.unknown.length > 0) : undefined,
      serviceUuids: uuids.length > 0 ? uuidSearch : undefined,
      serviceData: serviceData || undefined,
      product: product || undefined,
      company: company || undefined,
      companyCode: companyCode || undefined,
      localname: reach(gapObj, 'LocalName.0.value') || undefined,
      broadcastname: reach(gapObj, 'BroadcastName.0.value') || undefined,
      txpower,
      appleContinuity
    }

    return
  }

  static async indexBleDevice(party, dev, point){

    const now = moment().valueOf()
    const packetHash = md5(dev.advertising.data)

    let advs = (await party.find()
      .type('ble_adv')
      .where('address').equals(dev.id.toLowerCase())
      .where('packet.hash').equals(packetHash)
      .limit(1)
      .exec())

    let bleAdvDoc = advs[0]

    if(!bleAdvDoc){
      bleAdvDoc = await BleAdvDocument.createFromBleDevice(party, dev, packetHash, point)
      debug('created', bleAdvDoc.data)

      bleAdvDoc.parsePacket()

      //console.log(bleAdvDoc.cleanData)

      const currentRssi = {
        rssi: dev.rssi,
        time: now,
        hash: packetHash
      }
      
      await Promise.all([
        bleAdvDoc.save(),
        BleObs.indexBleObs(party, currentRssi)
      ])

      return bleAdvDoc
    }

    debug('indexBleDevice', bleAdvDoc.data)

    const currentRssi = {
      rssi: dev.rssi,
      time: now,
      hash: packetHash
    }
    
    bleAdvDoc.data.geobounds = GeoUtils.updatGeoBoundsByPoint(bleAdvDoc.data.geobounds, point)
    bleAdvDoc.data.location = GeoUtils.updateLocationBounds(bleAdvDoc.data.location, point)
    bleAdvDoc.data.timebounds = GeoUtils.updateTimebounds(bleAdvDoc.data.timebounds, now)
    bleAdvDoc.data.best = GeoUtils.updateBestRssi(bleAdvDoc.data.best, currentRssi)
    bleAdvDoc.data.worst = GeoUtils.updateWorstRssi(bleAdvDoc.data.worst, currentRssi)
    bleAdvDoc.data.packet.seen++
    
    await Promise.all([
      bleAdvDoc.save(),
      BleObs.indexBleObs(party, currentRssi)
    ])


    return bleAdvDoc
  }

  static get DocumentSchema(){
    return 'ble_adv'
  }

  static async createFromBleDevice(party, dev, packetHash, point){
    debug('create')

    const now = moment().valueOf()

    const loc = !point ? undefined : {
      lat: point.latitude,
      lon: point.longitude
    }


    return await party.createDocument('ble_adv', {
      address: dev.id.toLowerCase(),
      created: now,
      packet: {
        hash: packetHash,
        base64: dev.advertising.data,
        seen: 1
      },

      timebounds: {
        first: now,
        last: now
      },
      location: {
        first: loc,
        last: loc
      },
    
      best: {
        time: now,
        rssi: dev.rssi
      },

      worst: {
        time: now,
        rssi: dev.rssi
      },
    
      geobounds: {
        min: loc,
        max: loc
      }
    })
  }
}