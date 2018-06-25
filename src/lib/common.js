export default class Common {
  
  constructor() { }
  
  static async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
}