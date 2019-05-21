import request from 'request'
import config from '../../config/common'

export default class Autobots {
  
  constructor({ url, apiToken }) {
    this.url = url || config.autobots.url
    this.apiToken = apiToken
  }
  
  async getBots() {
    return new Promise((resolve, reject) => {
      request.get({
        url: `${this.url}/bot?page[limit]=0`,
        headers: { 'content-type': 'application/json', 'x-api-token': this.apiToken },
        json: true
      }, (error, response, body) => {
        if (error) return reject(`Get bots error:`, error)
        if (response.statusCode !== 200) return reject(`Get bots response code:`, response.statusCode)
        resolve(body.data)
      })
    })
  }
  
  async restartLoginBot(host) {
    return new Promise((resolve, reject) => {
      request.get({
        url: `${this.url}/bot/restart/login?host=${host}`,
        headers: { 'content-type': 'application/json', 'x-api-token': this.apiToken },
      }, (error, response) => {
        if (error) return reject(`Restart relogin error:`, error)
        if (response.statusCode !== 200) return reject(`Restart relogin response code:`, response.statusCode)
        resolve()
      })
    })
  }
  
  async makeTrade(trade) {
    return new Promise((resolve, reject) => {
      if (!trade.itemsToReceive && !trade.itemsToGive) return reject('No items in trade')
      if (!trade.partner && !trade.apiToken) return reject('Trade target is incorrect')
      request.post({
        url: `${this.url}/trade`,
        headers: { 'content-type': 'application/json', 'x-api-token': this.apiToken },
        body: JSON.stringify(trade)
      }, (error, response, body) => {
        if (error) return reject(`Create trade error:`, error)
        if (response.statusCode !== 201) return reject(`Create trade response code:`, response.statusCode)
        resolve(JSON.parse(body).message)
      })
    })
  }
  
  async makeTradeWithId(trade) {
    return new Promise((resolve, reject) => {
      if (!trade.itemsToGive.length) return reject('No items in trade')
      if (!trade.partner && !trade.apiToken) return reject('Trade target is incorrect')
      request.post({
        url: `${this.url}/trade-with-skins`,
        headers: { 'content-type': 'application/json', 'x-api-token': this.apiToken },
        body: JSON.stringify(trade)
      }, (error, response, body) => {
        if (error) return reject(`Create trade error:`, error)
        if (response.statusCode !== 201) return reject(`Create trade response code:`, response.statusCode)
        resolve(JSON.parse(body).message)
      })
    })
  }
  
  async makeTradeById(trade) {
    return new Promise((resolve, reject) => {
      if (!trade.itemsToGive.length) return reject('No items in trade')
      if (!trade.partner && !trade.apiToken) return reject('Trade target is incorrect')
      request.post({
        url: `${this.url}/trade-by-skins`,
        headers: { 'content-type': 'application/json', 'x-api-token': this.apiToken },
        body: JSON.stringify(trade)
      }, (error, response, body) => {
        if (error) return reject(`Create trade error:`, error)
        if (response.statusCode !== 201) return reject(`Create trade response code:`, response.statusCode)
        resolve(JSON.parse(body))
      })
    })
  }

}