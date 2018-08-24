import Mongo from '../lib/mongo'

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  await mongo.update('skins', { uid: { $exists: true } }, { $unset: { uid: "" } })
  
  await mongo.close()
  
}