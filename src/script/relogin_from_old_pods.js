import Autobots from '../lib/autobots'
import config from '../../config/common'
import Common from '../lib/common'

main().catch(console.error)

async function main() {
  
  const pattern = config.reloginOld.pattern
  const autobots = new Autobots({ apiToken: config.reloginOld.apiToken })
  
  const bots = await autobots.getBots().catch(console.error)
  for (const bot of bots.filter(bot => bot.server && !bot.server.includes(pattern))) {
    console.log('Relogin:', bot.login)
    await autobots.restartLoginBot(bot.server)
    await Common.sleep(100)
  }
  
}