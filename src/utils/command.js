const exec = require('child_process').exec;
const debug = require('debug')('command')

exports.exec = async function(cmd, opts={}){
  debug('exec -', cmd)
  let promise = await new Promise((resolve,reject)=>{


    let child = exec(cmd, opts, (err, stdout, stderr)=>{
      debug(err)
      debug(stderr)
      debug(stdout)

      if(err){
        err.stdout = stdout
        err.stderr = stderr
        
        reject(err)
        return
      }

      resolve({ stdout, stderr })
    })

    
  })
  .catch(err=>{throw err})

  return promise
}