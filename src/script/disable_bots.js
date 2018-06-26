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
    
    await mongo.update('bots', { login: { $in: logins } }, { $set: { isActive: false } })
    
    await mongo.close()
    
  })
  
}