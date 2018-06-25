import Mongo from '../lib/mongo'
import config from '../../config/common'

main().catch(console.error)

async function main() {
  
  const oid = Mongo.objectIdFromDate(Date.now() - config.failWaitingTrades.lifetime)
  
  const mongo = new Mongo({})
  await mongo.getDb()
  await mongo.update('trades', { _id: { $lt: oid }, state: 0 }, { $set: { state: -1 } })
  await mongo.close()
  
}