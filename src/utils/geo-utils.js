const moment = require('moment')
const EarthDistance = require('earth-distance-js')

function toLoc(location){
  return {
    lat: location.latitude || location.lat || 0,
    lon: location.longitude || location.longitude || 0
  }
}

exports.updatGeoBoundsByPoint = (bounds, point)=>{

  if(!point){ return bounds }

  return {
    min: !bounds.min ? toLoc(point) : {
      lat: point.latitude < bounds.min.lat ? point.latitude : bounds.min.lat,
      lon: point.longitude < bounds.min.lon ? point.longitude : bounds.min.lon
    },
    max: !bounds.max ? toLoc(point) : {
      lat: point.latitude > bounds.max.lat ? point.latitude : bounds.max.lat,
      lon: point.longitude > bounds.max.lon ? point.longitude : bounds.max.lon
    }
  }
}

exports.updatGeoBoundsByGeoBounds = (bounds, otherBounds)=>{

  if(!otherBounds){ return bounds }

  let min = bounds.min
  let max = bounds.max

  if(!min){
    min = otherBounds.min
  } else if (otherBounds.min) {
    min = {
      lat: otherBounds.min.lat < bounds.min.lat ? otherBounds.min.lat : bounds.min.lat,
      lon: otherBounds.min.lon < bounds.min.lon ? otherBounds.min.lon : bounds.min.lon
    }
  }

  if(!max){
    max = otherBounds.max
  } else if (otherBounds.max) {
    max = {
      lat: otherBounds.max.lat > bounds.max.lat ? otherBounds.max.lat : bounds.max.lat,
      lon: otherBounds.max.lon > bounds.max.lon ? otherBounds.max.lon : bounds.max.lon
    }
  }

  return { min, max }
}

exports.updateTimebounds = (bounds, time)=>{

  let retVal = {...bounds}

  let first = moment(bounds.first)
  let last = moment(bounds.last)
  let current = moment(time)

  if(last.isBefore(current)){

    let duration = current.diff(first, 'ms')

    retVal = {
      first: first.valueOf(),
      last: current.valueOf(),
      duration
    }
  }

  if(first.isAfter(current)){

    let duration = current.diff(first, 'ms')

    retVal = {
      first: current.valueOf(),
      last: last.valueOf(),
      duration
    }
  }

  return retVal
}

exports.updateLocationBounds = (location, point)=>{

  if(!point){ return location }

  let bound = {
    first: !location.first ? toLoc(point) : location.first,
    last: toLoc(point)
  }

  bound.distance = EarthDistance.haversine(bound.first, bound.last)

  if(typeof bound.distance !== 'number'){
    let err = new Error( {
      location,
      point,
      reason: bound.distance
    } )

    console.error('invalid haversine',err)
    throw err
  }

  return bound
}

exports.updateBestRssi = (best, current)=>{
  return best.rssi > current.rssi ? best : current
}

exports.updateWorstRssi = (worst, current)=>{
  return worst.rssi < current.rssi ? worst : current
}