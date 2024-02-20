class DeltaTime {
    constructor(){
      this.startMs = null
      this.endMs = null
      this.deltaMs = null
    }
  
    start(){
      this.startMs = (new Date).getTime()
      return this
    }
  
    stop(){
      this.endMs = (new Date).getTime()
  
      this.deltaMs = this.endMs - this.startMs 
    }
  
  }
  
  module.exports = DeltaTime