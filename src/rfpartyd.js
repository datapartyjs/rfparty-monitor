const Path = require('path')
const debug = require('debug')('rfpartyd')
const Dataparty = require('@dataparty/api/src/index')


const RFPartyModel = require('../dataparty/@dataparty-rfparty-monitor.dataparty-schema.json')
//const RFPartyService = require('../dataparty/@dataparty-rfparty-monitor.dataparty-service.json')
const RFPartyDocuments = require('./documents')

const RfpartyService = require('../party/rfparty-service')
const Pkg = require('../package.json')

const BASE_PATH = process.env.SNAP_COMMON || ((process.env.HOME) ? (process.env.HOME + '/.rfparty-monitor') : '.' )


async function main(){


  const service = new RfpartyService({ name: Pkg.name, version: Pkg.version })


  const build = await service.compile(Path.join(__dirname,'../dataparty'), true)


  let config = new Dataparty.Config.JsonFileConfig({basePath: BASE_PATH})

  await config.start()

  const dbPath = await config.touchDir('/db')
  const unixSocketPath = Path.join(BASE_PATH, 'unix-socket')

  debug('party db location', dbPath)
  debug('party socket location', unixSocketPath)

  
  let party = new Dataparty.TingoParty({
    path: dbPath,
    noCache: true,
    model: RFPartyModel,
    factories: RFPartyDocuments,
    config: config,
    qbOptions: {
      debounce: false,
      find_dedup: false,
      timeout: false
    }
  })



  debug('partying')

  //const service = new Dataparty.IService({}, RFPartyService)

  const runner = new Dataparty.ServiceRunnerNode({
    party, service,
    useNative: true,
    sendFullErrors: true
  })
  
  const webHost = new Dataparty.ServiceHost({
    runner,
    trust_proxy: false,
    //listenUri: 'http://0.0.0.0:4000'
  })



  const unixSocketHost = new Dataparty.ServiceHost({
    runner,
    trust_proxy: false,
    wsEnabled: true,
    listenUri: 'file://'+unixSocketPath,
    wsUpgradePath: '/'
  })
  

  await party.start()
  await runner.start()
  await webHost.start()
  await unixSocketHost.start()

  let exitted = false

  const exitHandler = async()=>{

    if(exitted){return}
    console.log('exiting')

    exitted = true
    await unixSocketHost.stop()
    await webHost.stop()
    process.exit()
  }

  process.on('exit', exitHandler)
  process.on('SIGINT', exitHandler);
  // catches "kill pid" (for example: nodemon restart)
  //process.on('SIGUSR1', exitHandler);
  //process.on('SIGUSR2', exitHandler);

  // catches uncaught exceptions
  //process.on('uncaughtException', exitHandler);

  console.log('started')
  
  //process.exit()
}



main().catch(err=>{
  console.error(err)
})