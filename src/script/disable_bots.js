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
    
    const bots = await mongo.find('bots', { login: { $in: logins } })
    const apps = await mongo.find('applications', { })
    
    await mongo.update('bots', { login: { $in: logins } }, { $set: { isActive: false } })

    await mongo.close()
    
    for (const bot of bots) {
      const app = apps.find(app => String(app._id) === String(bot._application))
      console.log(bot.login, app.code)
    }
    
  })
  
}