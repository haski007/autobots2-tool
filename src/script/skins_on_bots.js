import Mongo from '../lib/mongo'
import config from '../../config/common'
import fs from 'fs'
import readline from 'readline'

main().catch(console.error)

async function main() {
  
  const lineReader = readline.createInterface({ input: fs.createReadStream(config.skinsOnBots.inputFile) })
  const logins = []
  lineReader.on('line', line => logins.push(line.replace(/[\"\'\,]/g, '').trim()))
  lineReader.on('close', async () => {
  
    const mongo = new Mongo({})
    await mongo.getDb()
  
    const bots = await mongo.find('bots', { login: { $in: logins }})
    const skins = await mongo.find('skins', { _bot: { $in: bots.map(b => Mongo.objectId(b._id))} })
  
    await mongo.close()
  
    const file = fs.createWriteStream(`./result/skins_on_bots_${Date.now()}.csv`)
    for (const skin of skins) file.write(`${skin.appid}, ${skin._id}, ${skin.assetid}\r\n`)
    
  })
  
}