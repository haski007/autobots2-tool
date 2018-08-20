import Mongo from '../lib/mongo'

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  const skins = await mongo.find('skins', { })
  for (const skin of skins) {
    await mongo.update('skins', { appid: skin.appid, assetid: skin.assetid }, { $set: { uid: `${skin.assetid}_${skin.appid}` } })
  }
  await mongo.close()
  
}