const { UUIDParser } = require("./uuid-parser")
const DeviceIdentifiers = require('./device-identifiers')

module.exports = class AppleContinuity{
  static parse(manufacturerData){
    const subType = manufacturerData.subarray(2, 3).toString('hex')
    const subTypeLen = manufacturerData[3]

    let doc = {}
    doc.typeCode = subType

    if( subTypeLen + 4 >  manufacturerData.length){
      //console.error(device + originalJSON)
      doc.protocolError = {
        appleContinuity: 'incorrect message length[' + subTypeLen +'] when ' + (manufacturerData.length-4) + ' (or less) was expected'
      }

      //console.warn(doc.address + ' - ' + doc.protocolError.appleContinuity)
      //throw new Error('corrupt continuity message???')
    }

    let appleService = UUIDParser.lookupAppleService(subType)
    if(appleService){
      doc.services = [appleService]
    }

    if(subType =='09'){
      // Parse AirPlayTarget messages

      const devIP = manufacturerData.subarray( manufacturerData.length-4, manufacturerData.length )

      const appleIp = devIP[0] + '.'
        + devIP[1] + '.'
        + devIP[2] + '.'
        + devIP[3]

        if(!doc.service){doc.service={}}
        doc.service.airplay = {ip: appleIp}
    }
    else if(subType == '02'){
      // Parse iBeacon messages

      if(subTypeLen != 21){
        doc.protocolError = {
          ibeacon: 'incorrect message length[' + subTypeLen +'] when 21 bytes was expected'
        }
        //console.warn(doc.address + ' - ' + doc.protocolError.ibeacon)
      }
      else{
        if(!doc.service){doc.service={}}
        doc.service.ibeacon = {
          uuid: manufacturerData.subarray(4, 19).toString('hex'),
          major: manufacturerData.subarray(20, 21).toString('hex'),
          minor: manufacturerData.subarray(22, 23).toString('hex'),
          txPower: manufacturerData.readUInt8(24)
        }
      }
    }
    else if(subType == '12'){
      // Parse FindMy messages

      const status = manufacturerData.readInt8(4)

      if(!doc.service){doc.service={}}
      doc.service.findmy = { maintained: (0x1 & (status >> 2)) == 1 ? true : false }
    }
    else if(subType == '10'){
      // Parse NearbyInfo messages
      const flags = manufacturerData[4] >> 4
      const actionCode = manufacturerData[4] & 0x0f
      const status = manufacturerData[5]
      if(!doc.service){doc.service={}}
      doc.service.nearbyinfo = {
        flags: {
          unknownFlag1: Boolean((flags & 0x2) > 0),
          unknownFlag2: Boolean((flags & 0x8) > 0),
          primaryDevice: Boolean((flags & 0x1) > 0),
          airdropRxEnabled: Boolean((flags & 0x4) > 0),
          airpodsConnectedScreenOn: Boolean((status & 0x1) > 0),
          authTag4Bytes: Boolean((status & 0x02) > 0),
          wifiOn: Boolean((status & 0x4) > 0),
          hasAuthTag: Boolean((status & 0x10) > 0),
          watchLocked: Boolean((status & 0x20) > 0),
          watchAutoLock: Boolean((status & 0x40) > 0),
          autoLock: Boolean((status & 0x80) > 0)
        },
        actionCode: Buffer.from([actionCode]).toString('hex'),
        action: DeviceIdentifiers.NearbyInfoActionCode[actionCode]
      }
    } else if (subType == '0f'){
      // Parse NearbyAction messages
      const flags = manufacturerData[4]
      const action = manufacturerData[5]
      if(!doc.service){doc.service={}}

      const actionType = DeviceIdentifiers.NearbyActionType[action] || 'unknown('+action+')'
      doc.service.nearbyaction = { action: actionType }
    }

    return doc
  }
}