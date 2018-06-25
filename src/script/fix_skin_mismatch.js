import Mongo from '../lib/mongo'
import Steam from '../lib/steam'
import config from '../../config/common'

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  
  const bots = await mongo.find('bots', { _application: Mongo.objectId(config.fixSkinMismatch.application) })
  
  const result = {}
  for (const bot of bots) {
    console.log('Processing bot:', bot.login)
    const inventory = await Steam.getInventory(bot.steamId).catch(console.error)
    const skins = await mongo.find('skins', { _bot: Mongo.objectId(bot._id) })
    
    const offers = await Steam.getTradeOffers(bot.apiKey).catch(console.error)
    
    const missingLocaly = []
    const missingOnSteam = []
    
    for (const asset of inventory)
      if (!skins.find(skin => skin.assetid === asset.assetid))
        missingLocaly.push({ appid: asset.appid, assetid: asset.assetid })
    
    for (const skin of skins)
      if (!inventory.find(asset => asset.assetid && asset.assetid === skin.assetid)) {
      
        const offer = await Steam.findExportTradeOfferByAsset(offers, skin.assetid)
        missingOnSteam.push({ appid: skin.appid, assetid: skin.assetid, offer })
        
        for (const missingSkin of missingOnSteam) {
          console.log(missingSkin)
          const { assetid, offer } = missingSkin
          
          if (offer) {
            const steamId = Steam.partnerToSteamId(offer.accountid_other)
            const recipient = await mongo.find('bots', { steamId }).catch(console.error)
            const login = recipient.login
  
            if (!login && steamId) await mongo.update('skins', { assetid }, {
              $set: { _organization: null, _application: null, _bot: null, foreignBotSteamId: steamId }
            })
          }
        }
      }
      
    result[bot.steamId] = { missingLocaly, missingOnSteam }

    if (missingLocaly.length || missingOnSteam.length)
      console.log(`app: ${bot._application}, bot: ${bot.login}(${bot.steamId}),`, 'not on Steam:', missingOnSteam.length, 'not in Mongo:', missingLocaly.length)
  }
  
  await mongo.close()
  
}