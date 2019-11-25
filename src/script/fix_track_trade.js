import Mongo from '../lib/mongo'
import Steam from '../lib/steam'
import Redis from "../lib/redis"

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()

  const trades = await mongo.find('trades', {
    state: 3,
    _id: Mongo.objectId('5dd8fcfe7c5896000b32200f')
  })
  
  console.log(trades.length)

  for (const trade of trades) {
    const skins = await mongo.find('skins', { _trade: trade._id })
    if (skins.length && skins.length === trade.itemsToReceive) {
      console.log(`All skins from trade _id ${trade._id} are already in DB`)
      continue
    }

    const bot = await mongo.findOne('bots', { _id: trade._bot })
    if (skins.length && skins.length === trade.itemsToReceive) {
      console.log(`No bot from trade _id ${trade._id} in DB`)
      continue
    }

    console.log(`Processing trade _id ${trade._id}`)
    const offer = await Steam.getTradeOffer(trade.apiKey, trade.steamTradeId).catch(console.error)

    if (!offer.tradeid) {
      console.log(`No trade details for trade ${trade._id}`)
      continue
    }

    console.log(`Retrieving trade details for trade ${trade._id}`)
    const tradeSteam = await Steam.getTrade(trade.apiKey, offer.tradeid).catch(console.error)

    if (tradeSteam.assets_received && tradeSteam.assets_received.length) {
      for (const asset of tradeSteam.assets_received) {
        const skin = await mongo.findOne('skins', { appid: asset.appid, assetid: asset.new_assetid })//, _trade: null })
        if (!skin) {
          // TODO: remove/merge
          console.log(`Not exists: ${asset.new_assetid}`)
        } else {
          console.log(`Exists: ${skin.assetid}`)
          await mongo.update('skins', { appid: skin.appid, assetid: skin.assetid }, {
            $set: {
              _trade: trade._id
            },
            $addToSet: {
              points: {
                assetid: asset.assetid,
                tradeId: trade.steamTradeId,
                to: bot.steamId,
                from: trade.partner,
                toApplication: trade._application
              },
              _tradeIds: trade._id
            }
          }).catch(console.error)
          console.log('Item updated:', asset.new_assetid)
        }
      }
    }
  
    const redis = new Redis({})
    
    const skinsFromTrade = await mongo.find('skins', { _trade: trade._id })
    
    await redis.lpush('__hooks__', skinsFromTrade.map(s => "skin:" + s._id + ":0:0:0"))

    redis.quit()
  }

  await mongo.close()
}