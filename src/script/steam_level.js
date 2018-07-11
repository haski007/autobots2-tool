import Common from '../lib/common'
import config from '../../config/common'
import fs from 'fs'
import readline from 'readline'
import request from 'request'

main().catch(console.error)

async function main() {
  
  const steamIds = await getAll()
  const processed = await getProcessed()
  
  console.log(steamIds[0])
  console.log(processed[0])

  const file = fs.createWriteStream(`./result/steam_level_${Date.now()}.csv`)
  for (const id of steamIds) {
    if (processed.includes(id)) continue
    await Common.sleep(100)
    request.get({
      url: `http://api.steampowered.com/IPlayerService/GetSteamLevel/v1/?key=CB8F73813C3E71AB0C8402C4660ACA6B&steamid=${id}`,
      json: true
    }, async (err, response, body) => {
      if (err) console.error(id, err)
      console.log(id, response.statusCode, body)
      if (body && body.response && typeof body.response.player_level === 'number') {
        console.log(id, body.response.player_level)
        file.write(`${id}, ${body.response.player_level}\r\n`)
      }
    })
  }
}

async function getProcessed() {
  const lr = readline.createInterface({ input: fs.createReadStream('./input/steam_ids_processed.csv') })
  const processed = []
  return new Promise((resolve) => {
    lr.on('line', line => processed.push(line.replace(/[\"\'\,]/g, '').trim()))
    lr.on('close', async () => {
      console.log('Processed', processed.length)
      resolve(processed)
    })
  })
}

async function getAll() {
  const lr = readline.createInterface({ input: fs.createReadStream(config.steamLevel.inputFile) })
  const all = []
  return new Promise((resolve) => {
    lr.on('line', line => all.push(line.replace(/[\"\'\,]/g, '').trim()))
    lr.on('close', async () => {
      console.log('All', all.length)
      resolve(all)
    })
  })
}