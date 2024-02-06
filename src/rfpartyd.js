const Path = require('path')
const debug = require('debug')('rfpartyd')
const Dataparty = require('@dataparty/api')

const VenueService = require('./rfparty-service')





async function main(){

  const uri = 'mongodb://localhost:27017/venue-test'
  debug('db location', uri)




  const service = new VenueService({ name: '@dataparty/venue', version: '0.0.1' })


  const build = await service.compile(Path.join(__dirname,'../../dataparty'), true)


  debug('compiled')

  console.log(Object.keys(BouncerServerModels))

  const serverModels = {
    Utils: BouncerServerModels.Utils,
    Model: BouncerServerModels.Model,
    Types: {
      ...BouncerServerModels.Types,
      //BanList: require('./schema/ban_list'),
      VenueSrv: require('./schema/venue_service')
    }
  }

  let party = new Dataparty.MongoParty({
    uri,
    model: build.schemas,
    serverModels,
    config: new Dataparty.Config.MemoryConfig()
  })

  const dbPath = 'dataparty-venue.db'

  debug('party db location', dbPath)

  /*let party = new Dataparty.LocalParty({
    path: dbPath,
    model: build.schemas,
    config: new Dataparty.Config.MemoryConfig()
  })*/



  debug('partying')

  const runner = new Dataparty.ServiceRunner({
    party, service,
    sendFullErrors: true
  })
  
  const host = new Dataparty.ServiceHost({runner, trust_proxy: true})

  await party.start()
  await runner.start()
  await host.start()

  console.log('started')
  
  //process.exit()
}



main().catch(err=>{
  console.error(err)
})