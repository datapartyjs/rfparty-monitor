const gpsd = require('node-gpsd')

const listener = new gpsd.Listener({
  port: 2947,
  hostname: 'localhost',
  logger:  {
      info: function() {},
      warn: console.warn,
      error: console.error
  },
  parse: true
})



listener.on('TPV', (data)=>{
  console.log('tpv data', data)
})

listener.on('SKY', (data)=>{
  console.log('sky data', data)
})

listener.on('INFO', (data)=>{
  console.log('info data', data)
})

listener.on('DEVICE', (data)=>{
  console.log('device data', data)
})

listener.on('TOFF', (data)=>{
  console.log('TOFF data', data)
})




listener.connect(function() {
  console.log('Connected');
});

listener.watch({
  class: 'WATCH',
  json: true,
  nmea: false
})