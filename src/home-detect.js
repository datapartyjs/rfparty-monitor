const Wifi = require('node-wifi')
const debug = require('debug')('HomeDetector')
const Command = require('./utils/command')
const EventEmitter = require('events')



const SCAN_FIELD_HEADERS='active,ssid,bssid,mode,chan,freq,signal,security,wpa-flags,rsn-flags'

class HomeDetector extends EventEmitter {
  constructor({iface, knownBSSID}){
    super()
    
    this.enabled = true
    this.iface = iface
    this.knownBSSID = knownBSSID.map(i=>i.toUpperCase)
    this.knwonCount = 0
    this.knownMin = Math.ceil(this.knownBSSID/2)
    this.lastScan = null
    this.isHome = false

    this.scanDelayMs = 15000
  }

  stop(){
    this.enabled = false
  }

  async start(){
    await Wifi.init({iface:this.iface})

    this.enabled = true

    await this.scan()
  }

  matchBssid(line){
    return line.match(
      /[A-F0-9]{2}\\:[A-F0-9]{2}\\:[A-F0-9]{2}\\:[A-F0-9]{2}\\:[A-F0-9]{2}\\:[A-F0-9]{2}/
    )
  }


  parseScan(lines){
    return lines.filter(line => line !== '' && line.includes(':'))
    .filter(line => this.matchBssid(line))
    .map(line => {
      const match = this.matchBssid(line);
      const bssid = match[0].replace(/\\:/g, ':');

      const fields = line.replace(match[0]).split(':');

      const [
        // eslint-disable-next-line no-unused-vars
        active,
        ssid,
        // eslint-disable-next-line no-unused-vars
        bssidAlreadyProcessed,
        mode,
        channel,
        frequency,
        quality,
        security,
        security_flags_wpa,
        security_flags_rsn
      ] = fields;

      return {
        ssid,
        bssid,
        mac: bssid, // for retrocompatibility with version 1.x
        mode,
        channel: parseInt(channel),
        frequency: parseInt(frequency),
        signal_level: -quality,
        security: security !== '(none)' ? security : 'none',
        security_flags: {
          wpa: security_flags_wpa,
          rsn: security_flags_rsn
        }
      };
    })
  }

  async runScan(){

    let args = [
      '--terse',
      '--fields',
      SCAN_FIELD_HEADERS,
      'device',
      'wifi',
      'list',
      '--rescan yes'
    ]

    if(this.iface){
      args.push('ifname')
      args.push(this.iface)
    }
      

    try{
      let cmd = 'sudo nmcli ' + args.join(' ')
  
      const result = await Command.exec(cmd)
  
      const obj = this.parseScan(result.stdout.split('\n'))
      return obj
    }
    catch(err){}

    return []
  }

  async scan(){
    debug('scanning')

    this.lastScan = await this.runScan()
    
    //this.lastScan = await Wifi.scan()

    this.knwonCount = 0

    for(let network of this.lastScan){
      const netBSSID = network.bssid.toUpperCase()

      if(this.knownBSSID.indexOf(netBSSID) != -1){
        this.knwonCount++
      }

      this.emit('network', network)
    }

    debug('found', this.knwonCount)
    this.isHome = this.knwonCount >= this.knownMin 

    this.emit('is-home', this.isHome)
  

    if(this.enabled){
      setTimeout(this.scan.bind(this), this.scanDelayMs)
    }
  }
}

module.exports = HomeDetector

/*

async function main(){
  
  let home = new HomeDetector({
    iface:'wlan0',
    knownBSSID: BSSID
  })

  home.on('is-home', debug)

  await home.start()
  
  //console.log(networks)
}

main()
  .then(console.log)
  .catch(console.error)
*/
