/*
  Reads the analtyics logs and converts the data to a CSV output, for further
  analysis within a spreadsheet.
*/

const filename = 'koa-dev-2021-09-28.log'
const logDir = `${__dirname.toString()}/../../logs/`

const lineReader = require('line-reader')
const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

async function readLogs () {
  try {
    const filePath = `${logDir}${filename}`
    console.log(`File path: ${filePath}`)

    // Create output string. Start with the header row.
    let outStr = 'Time,peerCnt,relayCnt,timerCnt,cpuUsage,memoryUsed\n'

    // Read in an process each line.
    lineReader.eachLine(filePath, function (line, last) {
      // console.log('line: ', line)
      const data = JSON.parse(line)
      // console.log(`${JSON.stringify(data, null, 2)}`)

      // Only process messages for analytics.
      if (data.message.includes('-analytics-')) {
        let thisLine = `${data.timestamp},`
        thisLine += `${data.ipfsCoord.peerCnt},`
        thisLine += `${data.ipfsCoord.relayCnt},`
        thisLine += `${data.wtfnode.timerCnt},`
        thisLine += `${data.cpu.cpuUsagePercent},`
        thisLine += `${bchjs.Util.floor2(data.memory.total - data.memory.free)}`
        thisLine += '\n'

        outStr += thisLine
      }

      if (last) {
        console.log(outStr)
      }
    })
  } catch (err) {
    console.error(err)
  }
}
readLogs()
