import config from '../../config/common'
import fs from 'fs'
import readline from 'readline'
import Common from '../lib/common'
import Mongo from '../lib/mongo'
import Autobots from '../lib/autobots'

main().catch(console.error)

async function main() {
  
  const mongo = new Mongo({})
  await mongo.getDb()
  
  const rules = await mongo.find('rules', { type: 'GET', _application: Mongo.objectId(config.processRules.toApp)})
  const ids = rules.filter(rule => rule.skin && rule.skin._id).map(rule => Mongo.objectId(rule.skin._id))
  
  const botSkinMap = {}
  const skins = await mongo.find('skins', { _id: { $in: ids }, tradable: true, appid: 570, _application: Mongo.objectId(config.processRules.fromApp) })
  
  const skinsFile = fs.createWriteStream(`./result/skins_from_rules_${Date.now()}.csv`)
  for (const skin of skins) {
    if (!botSkinMap[skin._bot]) botSkinMap[skin._bot] = []
    botSkinMap[skin._bot].push(skin)
    skinsFile.write(skin._id + '\r\n')
  }
  
  const skinKeyBots = await mongo.find('bots', { isActive: true, _application: Mongo.objectId(config.processRules.toApp)})
  const skinKeySkins = await mongo.find('skins', { _bot: { $in: skinKeyBots.map(bot => Mongo.objectId(bot._id)) } })

  const skinKeyBotSkinMap = {}
  for (const skinKeySkin of skinKeySkins) {
    if (!skinKeyBotSkinMap[skinKeySkin._bot]) skinKeyBotSkinMap[skinKeySkin._bot] = []
    skinKeyBotSkinMap[skinKeySkin._bot].push(skinKeySkin)
  }

  const botCsSize = {}
  for (const bot in skinKeyBotSkinMap)
    botCsSize[bot] = skinKeyBotSkinMap[bot].filter(skin => skin.appid === 730).length
  
  const trades = []
  for (const bot in botSkinMap) {
    const { apiKey, isActive } = (await mongo.find('bots', { _id: Mongo.objectId(bot) }))[0]
    if (!isActive) continue
    const botCsItems = botSkinMap[bot].filter(skin => skin.appid === 730).length
    const readyBot = Object.keys(botCsSize).find(key => botCsSize[key] + botCsItems <= 900)
    botCsSize[readyBot] += botCsItems
    const { partner, token } = skinKeyBots.find(b => String(b._id) === readyBot && b.isActive )
    const items = botSkinMap[bot].map(({ assetid, classid, appid, contextid, instanceid }) => {
      return { assetid, classid, appid, contextid, instanceid }
    })
    while (items.length)
      trades.push({ apiKey, partner, token, itemsToGive: items.splice(0, 20) })
  }
  
  const file = fs.createWriteStream(`./result/trades_from_rules_${Date.now()}.csv`)
  const autobots = new Autobots({ apiToken: config.processRules.apiToken })
  for (const trade of trades) {
    await Common.sleep(20 * 1000)
    const message = await autobots.makeTrade(trade).catch(console.error)
    if (message) {
      file.write(message + '\r\n')
      console.log('Created trade: ', message)
    }
  }
  
  await mongo.close()
  
}

