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

  debug('party db location', dbPath)

  
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
  
  const host = new Dataparty.ServiceHost({
    runner,
    trust_proxy: false,
    //listenUri: 'http://0.0.0.0:4000'
  })

  await party.start()
  await runner.start()
  await host.start()

  console.log('started')
  
  //process.exit()
}



main().catch(err=>{
  console.error(err)
})