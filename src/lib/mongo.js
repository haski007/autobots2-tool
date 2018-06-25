import mongo from 'mongodb'
import config from '../../config/common'

export default class Mongo {
  
  constructor({ connectionUrl, dbName }) {
    this.connectionUrl = connectionUrl || `mongodb://${config.mongo.host}:${config.mongo.port}` || 'mongodb://127.0.0.1:27017'
    this.dbName = dbName || config.mongo.db || 'main'
  }
  
  async getClient() {
    if (!this.client)
      this.client = await mongo.MongoClient.connect(this.connectionUrl)
      .catch(e => console.error('Create MongoDB client error:', e))
    return this.client
  }
  
  async getDb() {
    await this.getClient()
    return this.db = this.client.db(this.dbName)
  }
  
  async close(force = false) {
    await this.client.close(force)
    .catch(e => console.error('Close MongoDB client error:', e))
  }
  
  async find(collection, criteria) {
    return await this.db.collection(collection).find(criteria).toArray()
    .catch(e => console.error('Find in MongoDB error:', e))
  }
  
  async remove(collection, criteria) {
    return await this.db.collection(collection).remove(criteria)
    .catch(e => console.error('Remove from MongoDB error:', e))
  }
  
  async update(collection, criteria, update) {
    return await this.db.collection(collection).updateMany(criteria, update)
    .catch(e => console.error('Update in MongoDB error:', e))
  }
  
  static objectId(id) {
    return mongo.ObjectID(id)
  }
  
  static objectIdFromDate(timestamp = Date.now()) {
    return ObjectID(Math.floor(timestamp / 1000).toString(16) + '0000000000000000')
  }
  
}