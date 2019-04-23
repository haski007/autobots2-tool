import config from '../../config/common'
import fs from 'fs'
import Common from '../lib/common'
import Mongo from '../lib/mongo'
import Autobots from '../lib/autobots'

main().catch(console.error)

async function main() {
  const mongo = new Mongo({})
  await mongo.getDb()
  
  // Get all active GET rules with skins
  const rules = await mongo.find('rules', {
    type: 'GET',
    status: { $in : ['PENDING', 'ACTIVE'] },
    _application: Mongo.objectId(config.processRules.toApp),
    'skin._id': { $ne: '' }
  })
  // Get skin IDs from rules
  const ids = rules.map(rule => Mongo.objectId(rule.skin._id))
  
  const botSkinMap = {}
  // All skins available for movement
  const skins = await mongo.find('skins', {
    _id: { $in: ids },
    tradable: true,
    inTrade: false,
    _application: Mongo.objectId(config.processRules.fromApp)
  })
  
  // Write available skins from rules to file and map by owner bot
  const skinsFile = fs.createWriteStream(`./result/skins_from_rules_${Date.now()}.csv`)
  for (const skin of skins) {
    if (!botSkinMap[skin._bot]) botSkinMap[skin._bot] = []
    botSkinMap[skin._bot].push(skin)
    skinsFile.write(skin._id + '\r\n')
  }
  
  // Get available receiver bots
  const skinKeyBots = await mongo.find('bots', {
    isActive: true,
    _application: Mongo.objectId(config.processRules.toApp)
  })
  // Get receiver bots' skins
  const skinKeySkins = await mongo.find('skins', {
    _application: Mongo.objectId(config.processRules.toApp)
  })

  // Map receivers' skins by owners
  const skinKeyBotSkinMap = {}
  for (const skinKeySkin of skinKeySkins) {
    if (!skinKeyBotSkinMap[skinKeySkin._bot]) skinKeyBotSkinMap[skinKeySkin._bot] = []
    skinKeyBotSkinMap[skinKeySkin._bot].push(skinKeySkin)
  }

  // Count CS:GO items per receiver
  const botCsSize = {}
  for (const bot in skinKeyBotSkinMap)
    botCsSize[bot] = skinKeyBotSkinMap[bot].filter(skin => skin.appid === 730).length
  
  const trades = []
  for (const botId in botSkinMap) {
    // Get sender
    const bot = (await mongo.find('bots', {
      isActive: true,
      apiKey: { $ne: "" },
      _id: Mongo.objectId(botId)
    }))[0]
    if (!bot) {
      console.log("### Unable to send from", botId)
      continue
    }
    // Find receiver with enough space
    const botCsItems = botSkinMap[botId].filter(skin => skin.appid === 730).length
    const readyBot = Object.keys(botCsSize).find(key => botCsSize[key] + botCsItems <= 1000)
    botCsSize[readyBot] += botCsItems
    const receiver = skinKeyBots.find(b => String(b._id) === readyBot && b.isActive && b.partner && b.token )
    if (!receiver) continue
    const { partner, token } = receiver
    // Create trade requests
    const items = botSkinMap[botId].map(({ assetid, appid, contextid }) => {
      return { assetid, appid, contextid }
    })
    while (items.length) {
      const trade = { apiKey: bot.apiKey, partner, token, itemsToGive: items.splice(0, 40) }
      trades.push(trade)
    }
  }
  
  // Init trades
  const file = fs.createWriteStream(`./result/trades_from_rules_${Date.now()}.csv`)
  const autobots = new Autobots({ apiToken: config.processRules.apiToken })
  for (const trade of trades) {
    await Common.sleep(60 * 1000)
    const message = await autobots.makeTrade(trade).catch(console.error)
    if (message) {
      file.write(message + '\r\n')
      console.log('Created trade: ', message)
    }
  }
  
  await mongo.close()
}

