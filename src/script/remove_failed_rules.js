import Mongo from '../lib/mongo'
import config from '../../config/common'
import fs from 'fs'

main().catch(console.error)

async function main() {
  
  const _organization = Mongo.objectId(config.removeFailedRules.organization)
  
  const mongo = new Mongo({})
  await mongo.getDb()
  
  const rules = await mongo.find('rules', { _organization, isPermanent: false, 'skin._id': { $exists: true } })
  
  const fileRules = fs.createWriteStream(`./result/invalid_rules_${Date.now()}.csv`)
  const fileSkins = fs.createWriteStream(`./result/invalid_rule_skins_${Date.now()}.csv`)
  
  const skins = []
  for (const rule of rules) {
    const skin = await mongo.find('skins', { _organization, _application: { $ne: null }, _id: Mongo.objectId(rule.skin._id) }, '_id')[0]
    if (!skin) {
      if (skins.indexOf(rule.skin._id) === -1) {
        fileSkins.write(`${rule.skin._id}\r\n`)
        skins.push(rule.skin._id)
      }
      await mongo.remove('rules', { _id: rule._id })
      fileRules.write(`${rule._id}\r\n`)
    }
  }
  
  await mongo.close()
  
}