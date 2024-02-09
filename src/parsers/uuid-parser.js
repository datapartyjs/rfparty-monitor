const UUID16_TABLES = require('./16bit-uuid-tables.json')
const MANUFACTURER_TABLE = require('./manufacturer-company-id.json')
const DeviceIdentifiers = require('./device-identifiers')


exports.UUIDParser = class UUIDParser {

  static lookupDeviceCompany(code){
    return  MANUFACTURER_TABLE.Company[code] 
  }


  static lookupAppleService(code){
    return DeviceIdentifiers.APPLE_Continuity[code]
  }


  static lookupDeviceUuids(uuids){
    let results = []
    let unknown = []
    let known = []
    for(let uuid of uuids){
      let value = UUIDParser.lookupDeviceUuid(uuid)

      if(!value){
        unknown.push(uuid)
        continue
      }

      known.push(uuid)

      if(results.indexOf(value) == -1){
        results.push(value)
      }
    }

    if(results.length == 0){
      results=undefined
    }

    return {
      results,
      known,
      unknown
    }
  }

  static lookupDeviceUuid(uuid){
    let deviceType = null

    //console.log('lookup uuid', uuid, 'type', typeof uuid, 'length', uuid.length)

    if(uuid.length == 4){
      //deviceType = DeviceIdentifiers.UUID16[uuid]
      deviceType = UUIDParser.lookupUuid16(uuid)
    }
    else if(uuid.length == 32){
      deviceType = DeviceIdentifiers.UUID[uuid] 
    }

    return deviceType
  }

  static lookupUuid16(uuid){
    const types = Object.keys(UUID16_TABLES)

    for(let type of types){
      let found = UUID16_TABLES[type][uuid]

      if(found){
        return '/'+type+'/'+found
      }
    }

    return null
  }


  static reverseLookupService(term){

    let possibles = []

    const types = Object.keys(UUID16_TABLES)

    for(let type of types){
      possibles.push( 
        ...(UUIDParser.reverseLookupByName(
            UUID16_TABLES[type], term, '/'+type+'/'
        ).map( name=>{return '/'+type+'/'+name }) )
      )
    }
    
    return possibles.concat( 
      UUIDParser.reverseLookupByName(DeviceIdentifiers.APPLE_Continuity, term),
      UUIDParser.reverseLookupByName(DeviceIdentifiers.UUID, term)
    )
  }

  static reverseLookupByName(map, text, prefix=''){
    let names = []
    const lowerText = text.toLowerCase()
    for(let code in map){
      const name = map[code]
      const prefixedName = prefix+name
      const lowerName = prefixedName.toLowerCase()

      if(lowerName.indexOf(lowerText) != -1 ){
        names.push(name)
      }
    }

    return names
  }

  static bufferToList(buffer, byteSize=2){
    let list = []
    
    let idx = 0;
    while(idx<buffer.length){
      
      let value = buffer.subarray(idx, idx+byteSize)

      list.push(value)

      idx+=byteSize
    }

    return list
  }

  static decodeUuidList(field, byteSize){
    let uuids = UUIDParser.bufferToList( field.raw.data, byteSize )
      .map( buf=>{
        return buf.reverse().toString('hex')
      })

    field.raw.data = field.raw.data.toString('hex')
    field.value = uuids
  }

  static decode16bitUuidList(field){
    return UUIDParser.decodeUuidList(field, 2)
  }

  static decode32bitUuidList(field){
    return UUIDParser.decodeUuidList(field, 4)
  }

  static decode128bitUuidList(field){
    return UUIDParser.decodeUuidList(field, 16)
  }


  static decodeServiceData(field, byteSize){
    let uuid = field.raw.data.subarray(0, byteSize).reverse().toString('hex')
    let data = field.raw.data.subarray(byteSize).toString('hex')

    field.raw.data = field.raw.data.toString('hex')
    field.value = {
      [uuid]: data
    }
  }

  static decode16bitServiceData(field){
    UUIDParser.decodeServiceData(field, 2)
  }

  static decode32bitServiceData(field){
    UUIDParser.decodeServiceData(field, 4)
  }

  static decode128bitServiceData(field){
    UUIDParser.decodeServiceData(field, 16)
  }
}