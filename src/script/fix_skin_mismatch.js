import Mongo from '../lib/mongo'
import Steam from '../lib/steam'
import config from '../../config/common'
import Common from "../lib/common"

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  
  const bots = await mongo.find('bots', { _application: Mongo.objectId(config.fixSkinMismatch.application) })

  for (const bot of bots) {
    console.log('Processing bot:', bot.login)
    const inventory = await Steam.getInventory(bot.steamId).catch(console.error)
    const skins = await mongo.find('skins', { _bot: Mongo.objectId(bot._id), appid: { $in: [ 440, 570, 730 ] } })
    
    const offers = await Steam.getTradeOffers(bot.apiKey).catch(console.error)
    
    const missingLocaly = {}
    const missingOnSteam = {}
    
    for (const asset of inventory) {
      if (!asset) continue
      if (!skins.find(skin => skin.assetid === asset.assetid)) missingLocaly[asset.assetid] = {
        appid: asset.appid,
        assetid: asset.assetid
      }
    }
  
    for (const skin of skins) {
      if (!skin) continue
      if (!inventory.find(asset => asset.assetid && asset.assetid === skin.assetid)) {
        if (!missingOnSteam[skin.assetid]) missingOnSteam[skin.assetid] = {
          appid: skin.appid,
          assetid: skin.assetid
        }
        if (!missingOnSteam[skin.assetid].offer) {
          const offer = await Steam.findTradeOfferByAsset(offers, skin.assetid)
          missingOnSteam[skin.assetid].offer = offer || 'not_found'
        }
      }
    }
    
    for (const assetid in missingLocaly) {
      console.log('Missing localy', assetid)
    }
  
    for (const assetid in missingOnSteam) {
      console.log('Missing on Steam', missingOnSteam[assetid].appid, assetid)
      if (!missingOnSteam[assetid]) continue
      const offer = missingOnSteam[assetid].offer
      if (offer && offer !== 'not_found') {
        const steamId = Steam.partnerToSteamId(offer.accountid_other)
        const recipient = await mongo.find('bots', { steamId }).catch(console.error)
        const login = recipient.login
        if (offer && offer.trade_offer_state !== 3)
          console.log('Rolled back:', assetid, offer.tradeofferid, offer.trade_offer_state)
        if (!login && steamId && offer.trade_offer_state === 3) {
          console.log('Updated:', assetid, offer.tradeofferid)
          await mongo.update('skins', { assetid }, {
            $set: { _organization: null, _application: null, _bot: null, foreignBotSteamId: steamId }
          })
        }
      }
    }
    await Common.sleep(5000)
  }
  
  await mongo.close()
  
}