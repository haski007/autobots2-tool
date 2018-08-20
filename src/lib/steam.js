import steamIdConvertor from 'steam-id-convertor'
import request from 'request'
import Common from "./common"

const APP_IDS = [ 440, 570, 730 ]

export default class Steam {
  
  static async getGameInventory(steamId, appId) {
    return new Promise((resolve, reject) => {
      if (!steamId) return reject('No steamId defined')
      if (!appId) return reject('No appId defined')
      const url = `https://steamcommunity.com/inventory/${steamId}/${appId}/2?count=5000`
      request.get({ url }, (error, response, body) => {
        if (error || response.statusCode !== 200)
          return reject(`Get inventory error for ${url}`, error, response.statusCode)
        const inventory = JSON.parse(body).assets
        inventory ? resolve(inventory) : resolve([])
      })
    })
  }
  
  static async getInventory(steamId, appIds = APP_IDS) {
    return new Promise(async (resolve, reject) => {
      let skins = []
      for (const appId of appIds)
        skins = skins.concat(await Steam.getGameInventory(steamId, appId).catch(async (e) => {
          console.error('Error', e)
          Common.sleep(10000)
          return await Steam.getInventory(steamId, appIds)
        }))
      resolve(skins)
    })
  }
  
  static async getTradeOffers(apikey) {
    return new Promise((resolve, reject) => {
      if (!apikey) return reject('No apiKey defined')
      const url = `https://api.steampowered.com/IEconService/GetTradeOffers/v1/?key=${apikey}&get_sent_offers=1&get_received_offers=1&languages=en&get_descriptions=0`
      request.get({ url }, (error, response, body) => {
        if (error || response.statusCode !== 200)
          return reject(`Get trade offers error for ${url}, ${error}, ${response.statusCode}`)
        const tradeOffers = JSON.parse(body).response
        tradeOffers ? resolve(tradeOffers) : resolve([])
      })
    })
  }
  
  static async getTradeOffer(apikey, offerId) {
    return new Promise((resolve, reject) => {
      if (!apikey) return reject('No apiKey defined')
      if (!offerId) return reject('No offerId defined')
      const url = `https://api.steampowered.com/IEconService/GetTradeOffer/v1/?tradeofferid=${offerId}&key=${apikey}`
      request.get({ url }, (error, response, body) => {
        if (error || response.statusCode !== 200)
          return reject(`Get trade offer error for ${url}, ${error}, ${response.statusCode}`)
        const offer = JSON.parse(body).response.offer
        offer ? resolve(offer) : resolve([])
      })
    })
  }
  
  static async getTrade(apikey, tradeId) {
    return new Promise((resolve, reject) => {
      if (!apikey) return reject('No apiKey defined')
      if (!tradeId) return reject('No tradeId defined')
      const url = `https://api.steampowered.com/IEconService/GetTradeStatus/v1/?key=${apikey}&tradeid=${tradeId}`
      request.get({ url }, (error, response, body) => {
        if (error || response.statusCode !== 200)
          return reject(`Get trade error for ${url}, ${error}, ${response.statusCode}`)
        const trade = JSON.parse(body).response.trades[0]
        return trade ? resolve(trade) : resolve([])
      })
    })
  }
  
  static findExportTradeOfferByAsset(offers, assetid) {
    const arr = []
    if (offers['trade_offers_sent']) arr.concat(offers['trade_offers_sent'])
    if (offers['trade_offers_received']) arr.concat(offers['trade_offers_received'])
    
    return arr.find(offer =>
        offer &&
        offer.items_to_give &&
        (offer.trade_offer_state === 3 || offer.trade_offer_state !== 3 && offer.tradeid)
        && offer.items_to_give.some(asset => asset.assetid === assetid)
    )
  }
  
  static partnerToSteamId(partner) {
    return steamIdConvertor.to64(partner)
  }
  
  static steamIdToPartner(steamId) {
    return steamIdConvertor.to32(steamId)
  }
  
}