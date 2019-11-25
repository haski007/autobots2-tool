import Mongo from '../lib/mongo'
import Steam from '../lib/steam'
import Common from '../lib/common'
import config from '../../config/common'

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  
  const skins = await mongo.find('skins', {
    _trade: { $exists: false },
    _application: Mongo.objectId(config.fixSkinTrade.application),
    _bot:  Mongo.objectId("5b5b2c705d48a60010d79a49")
  })
  
  const skinBotMap = {}
  for (const skin of skins) {
    if (!skinBotMap[skin._bot]) skinBotMap[skin._bot] = []
    skinBotMap[skin._bot].push(skin)
  }

  const tradesToCheck = []
  for (const bot in skinBotMap) {
    const trades = await mongo.find('trades', {
      // _bot: Mongo.objectId(bot), state: 3, itemsToReceive: { $gt: []}
      _id: { $in: [
          Mongo.objectId('5cc4899ca3f48b000d3b8f27'),
          Mongo.objectId('5cdef0698a561d000dac8049')
        ]
      }
    })
    for (const trade of trades) {
      // const tradeSkins = await mongo.count('skins', { _tradeIds: { $in: [ trade._id ] } })
      // console.log(tradeSkins)
      // if (trade.itemsToReceive.length !== tradeSkins.length) tradesToCheck.push(trade)
      tradesToCheck.push(trade)
    }
  }

  for (const trade of tradesToCheck) {
    const offer = await Steam.getTradeOffer(trade.apiKey, trade.steamTradeId).catch(console.error)
    if (offer && offer.trade_offer_state === 3) {
      const tradeSteam = await Steam.getTrade(trade.apiKey, offer.tradeid).catch(console.error)
      const items = tradeSteam.assets_received
      const steamId = tradeSteam.steamid_other
      const bots = await mongo.find('bots', { apiKey: trade.apiKey })
      if (!bots || !bots.length) {
        console.error("Bot not found with APIKey:", trade.apiKey)
        continue
      }
      const ourSteamId = bots[0].steamId
      if (items && items.length)
        for (const item of items) {
          const mongoItems = await mongo.find('skins', { assetid: item.new_assetid })
          if (!mongoItems || !mongoItems.length) {
            console.log('Item not found:', item.new_assetid)
            continue
          }
          await mongo.update('skins', { appid: item.appid, assetid: item.new_assetid }, {
            $set: {
              _trade: trade._id
            },
            $addToSet: {
              points: {
                assetid: item.assetid,
                tradeId: trade.steamTradeId,
                to: ourSteamId,
                from: steamId,
                toApplication: trade._application
              },
              _tradeIds: trade._id
            }
          }).catch(console.error)
          console.log('Item updated:', item.new_assetid)
        }
    }
    await Common.sleep(200)
  }
  await mongo.close()
  
}