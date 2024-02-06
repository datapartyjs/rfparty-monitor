const ISchema = require('@dataparty/api/src/service/ischema')

const Utils = ISchema.Utils

Utils.created = {
  type: Number,
  default: Date.now,
  required: true
}

exports.Location = {
  lat: Number,
  lon: Number
}

exports.LocationIndexed = {
  lat: {type: Number, index: true},
  lon: {type: Number, index: true}
}

exports.GapField = {
  type: {type: String},
  value: {},
  raw: {
    data: String,
    data_length: Number,
    field_length: Number,
    offset: Number,
    offset_next: Number,
    type: Number
  }
}

exports.BleParsedAdv = {
  //mtu: Number,
  //addressType: String,
  //connectable: Boolean,
  gapTypes: [String],
  gapFields: [Object],
  serviceUuids: {
    results: [{type:String, index:true}],
    known: [String],
    unknown: [String]
  },
  serviceData: Object,
  hasUnknownService: Boolean,
  product: {type: String, index: true},
  company: {type: String, index: true},
  companyCode: Utils.string(2,2),

  txpower: Number,

  localname: {type:String, index: true},
  broadcastname: {type:String, index: true},

  appleContinuity:{
    typeCode: String,
    services: [String],

    protocolError: Object,

    service:{

      airplay: {
        ip: {type: String, index: true}
      },

      ibeacon: {
        uuid: {type: String, index: true},
        major: String,
        minor: String,
        txPower: Number
      },

      findmy: {
        maintained: Boolean
      },

      nearbyaction: { action: String },
      nearbyinfo: {
        actionCode: Utils.string(2,2),
        action: {type: String, index: true},
        flags: {
          unknownFlag1: Boolean,
          unknownFlag2: Boolean,
          primaryDevice: Boolean,
          airdropRxEnabled: Boolean,
          airpodsConnectedScreenOn: Boolean,
          authTag4Bytes: Boolean,
          wifiOn: Boolean,
          hasAuthTag: Boolean,
          watchLocked: Boolean,
          watchAutoLock: Boolean,
          autoLock: Boolean,
        }
      }
    }
  }
}

exports.BlePacket = {
  hash: {type: String, index: true},
  base64: String,
  //gapFields: [exports.GapField],
  parsed: exports.BleParsedAdv,
  seen: {type: Number, index: true}
  /*seen: [{
    rssi: Number,
    time: Utils.created
  }]*/
}

exports.BleObservation = {
  rssi: Number,
  time: {type:Number, index: true},
  hash: {type: String, index: true}   //packet hash
}

exports.GeoBoundsIndexed = {
  min: exports.LocationIndexed,
  max: exports.LocationIndexed
}

exports.LocationBoundsIndexed = {
  first: exports.LocationIndexed,
  last: exports.LocationIndexed,
  distance: {type: Number, index: true}
}

exports.TimeBoundsIndexed = {
  duration: {type: Number, index: true},
  first: {type: Number, index: true},
  last: {type: Number, index: true}
}

exports.BleStationInfo = {
  //source: Utils.actor(['ble_source'], {indexId:true}),
  created: Utils.created,
  address: { type: String, maxlength: 20, minlength: 18, index: true},

  timebounds: exports.TimeBoundsIndexed,
  location: exports.LocationBoundsIndexed,
  
  geobounds: exports.GeoBoundsIndexed,

  seen: {type: Number, index: true},            //! count of total rx'd packets
  advertisements: {type: Number, index: true},  //! count of different advertisements

  best: {
    time: {type: Number, index: true},
    rssi: {type: Number, index: true}
  },

  worst: {
    time: {type:Number, index: true},
    rssi: {type: Number, index: true}
  }
}

exports.WifiStationInfo = {
  //source: Utils.actor(['ble_source'], {indexId:true}),
  created: Utils.created,
  mac: { type: String, maxlength: 20, minlength: 18, index: true},
  bssid: { type: String, maxlength: 20, minlength: 18, index: true},
  
  mode: String,

  timebounds: exports.TimeBoundsIndexed,
  location: exports.LocationBoundsIndexed,
  
  geobounds: exports.GeoBoundsIndexed,

  seen: {type: Number, index: true},            //! count of total rx'd packets
  advertisements: {type: Number, index: true},  //! count of different advertisements

  best: {
    time: {type: Number, index: true},
    rssi: {type: Number, index: true}
  },

  worst: {
    time: {type:Number, index: true},
    rssi: {type: Number, index: true}
  }
}

exports.GeoPoint = {
  time: Number,
  accuracy: Number,
  altitude: Number,
  bearing: Number,
  latitude: Number,
  longitude: Number,
  speed: Number,

  isStationary: Boolean,
  
  provider: String,
  locationProvider: Number,
  isFromMockProvider: Boolean,
  mockLocationsEnabled: Boolean,
}

exports.GeoPointIndexed = {
  time: {type:Number, index: true},
  accuracy: Number,
  altitude: Number,
  bearing: Number,
  latitude: {type:Number, index: true},
  longitude: {type:Number, index: true},
  speed: Number,

  isStationary: Boolean,
  
  provider: String,
  locationProvider: Number,
  isFromMockProvider: Boolean,
  mockLocationsEnabled: Boolean,
}

exports.GeoTrackInfo = {
  //source: Utils.actor(['ble_source'], {indexId:true}),
  created: Utils.created,

  timebounds: exports.TimeBoundsIndexed,

  location: exports.LocationBoundsIndexed,

  geobounds: exports.GeoBoundsIndexed,

  points: {type: Number, index: true}

  //points: [exports.GeoPoint]
}

exports.ActivityInfo = {
  //source: Utils.actor(['ble_source'], {indexId:true}),
  created: Utils.created,

  timebounds: exports.TimeBoundsIndexed,

  activity: [{
    type: {type: String},
    confidence: Number,
    time: Number
  }]
}
