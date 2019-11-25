import redis from 'redis'
import config from '../../config/common'

export default class Redis {
  
  constructor({ url }) {
    this.url = url || config.redis.url
    this.client = redis.createClient(this.url)
  }
  
  async lpush(key, values) {
    return new Promise(((resolve, reject) => {
      this.client.lpush(key, ...values, (err, cb) => {
        if (err) reject(err)
        resolve(cb)
      })
    }))
  }
  
  async lrange(key) {
    return new Promise((resolve, reject) => {
      this.client.lrange(key, 0, -1, (err, cb) => {
        if (err) reject(err)
        resolve(cb)
      })
    })
  }
  
  async setnx(key, value) {
    return new Promise((resolve, reject) => {
      this.client.setnx(key, value, (err, cb) => {
        if (err) reject(err)
        resolve(cb)
      })
    })
  }
  
  quit() {
    this.client.quit()
  }
  
}