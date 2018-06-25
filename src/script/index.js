main().catch(console.error)

async function main() {
  
  console.log('################################')
  console.log('### Welcome to autobots-tool ###')
  console.log('################################\n\n')
  console.log('Configuration for this tool: config/common.js')
  console.log('Default MongoDB connection configured for port-forward to localhost\n')
  console.log('To show this message execute:\tnpm run help')
  console.log('To move trades in 0 state to -1 execute:\tnpm run failWaitingTrades')
  console.log('To fix skin mismatch in AB DB and Steam execute:\tnpm run fixSkinMismatch')
  console.log('To fix skins without _trade field execute:\tnpm run fixSkinTrade')
  console.log('To remove failed rules execute:\tnpm run removeFailedRules')
  console.log('To get list of skins on certain bots execute:\tnpm run skinsOnBots')
  console.log('To move available skins from list to application:\tnpm run tradeSkinsToApp')

}
