const config = {
  mongo: {
    host: '127.0.0.1',
    port: 27017,
    db: 'main'
  },
  autobots: {
    url: 'http://autobots2.devss.xyz/api/latest',
  },
  failWaitingTrades: {
    lifetime: 1000 * 60 * 15
  },
  fixSkinMismatch: {
    application: ''
  },
  fixSkinTrade :{
    application: ''
  },
  removeFailedRules: {
    organization: ''
  },
  skinsOnBots: {
    inputFile: './input/bots.csv'
  },
  disableBots: {
    inputFile: './input/bots.csv'
  },
  enableBots: {
    inputFile: './input/bots.csv'
  },
  tradeSkinsToApp: {
    apiToken: '',
    inputFile: './input/skins_to_app.csv',
    fromApp: '',
    toApp: ''
  },
  steamLevel: {
    inputFile: './input/steam_ids.csv'
  },
};

module.exports = config;