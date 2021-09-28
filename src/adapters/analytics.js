/*
  A library for logging analytics.

  wtfnode has the following sections:
  - File descriptors:
  - Sockets:
  - Servers:
  - Timers:
  - Intervals:
*/

const wtf = require('wtfnode')
const os = require('os-utils')
const BCHJS = require('@psf/bch-js')
const bchjs = new BCHJS()

const { wlogger } = require('./wlogger')

let _this

class Analytics {
  constructor (localConfig = {}) {
    // TODO: Create input validation to ensure an instance of ipfs library is passed.
    this.ipfs = localConfig.ipfs

    // Persistant data.
    this.wtfState = {}

    // Process the wtfnode data with a custom function.
    wtf.setLogger('info', this.processWtf)
    // Ignore warnings.
    wtf.setLogger('warn', (data) => {})

    _this = this
  }

  async reportAnalytics () {
    console.log('Reporting analytics.')

    const ipfsCoordData = _this.getIpfsCoordData()
    // console.log('ipfsCoordData: ', ipfsCoordData)

    const wtfnodeData = _this.getWtfNodeData()

    const analyticsObj = {
      cpu: {
        cpuCount: os.cpuCount(),
        cpuUsagePercent: await _this.getCpuUsage(),
        cpuFree: await _this.getCpuFree(),
        load5MinAvg: os.loadavg(5)
      },
      memory: {
        total: Math.floor(os.totalmem()) / 1000,
        free: Math.floor(os.freemem()) / 1000,
        freePercent: bchjs.Util.floor8(os.freememPercentage())
      },
      uptime: {
        seconds: Math.floor(os.processUptime())
      },
      wtfnode: wtfnodeData,
      ipfsCoord: ipfsCoordData
    }
    console.log(`analyticsObj: ${JSON.stringify(analyticsObj, null, 2)}`)

    // Save the analytics data to a log file.
    wlogger.info('-analytics-', analyticsObj)

    return true
  }

  // Gathers data from the ipfs-coord library about current connections.
  getIpfsCoordData () {
    try {
      // console.log(
      //   '_this.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode: ',
      //   _this.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode
      // )

      const peers = _this.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.peerList
      const relays = _this.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode.relayData

      // Filter out relays that are not connected. Only count relays that are connected.
      const connectedRelays = relays.filter((x) => x.connected)

      const outObj = {
        peerCnt: peers.length,
        relayCnt: connectedRelays.length
      }

      return outObj
    } catch (err) {
      // Exit quietly on error and return an empty object
      return {}
    }
  }

  // This is the top-level function for handling wtfnode analytics data.
  // Retrieves and summarizes data from wtfnode library.
  getWtfNodeData () {
    // Dump summary data with wtfnode.
    wtf.dump()

    // There is no easy way to know when wtf.dump() is 'done' other than it exiting.
    // This method gets the final stats on the Intervals in the system.
    _this.finalizeWtf()

    // console.log(
    //   `wtf summary: ${JSON.stringify(_this.wtfState.summary, null, 2)}`
    // )

    return _this.wtfState.summary
  }

  // Complete the summary of wtfnode results.
  finalizeWtf () {
    // Record the number of Intervals.
    _this.wtfState.summary.intervalCnt =
      _this.wtfState.lineCnt - _this.wtfState.linePos.interval
  }

  processWtf (data) {
    // console.log(data)
    // console.log('data length: ', data.length)

    // Increment the line count tracker.
    _this.wtfState.lineCnt++

    // Reset the line count tracker when the first line of a wtf report is seen.
    if (data.toString().includes('- File descriptors:')) {
      _this.wtfState.lineCnt = 0
      _this.wtfState.linePos = {}
      _this.wtfState.summary = {}
    }

    if (data.toString().includes('- Sockets:')) {
      // Record the number of file descriptors.
      _this.wtfState.linePos.fileDescriptor = _this.wtfState.lineCnt
      _this.wtfState.summary.fileDescriptorCnt = _this.wtfState.lineCnt

      // console.log(`Sockets started on line ${_this.wtfState.lineCnt}`)
    }

    if (data.toString().includes('- Servers:')) {
      // Record the number of Sockets.
      _this.wtfState.linePos.socket = _this.wtfState.lineCnt
      _this.wtfState.summary.socketCnt =
        _this.wtfState.lineCnt - _this.wtfState.linePos.fileDescriptor

      // console.log(`Servers started on line ${_this.wtfState.lineCnt}`)
    }

    if (data.toString().includes('- Timers:')) {
      // Record the number of Servers.
      _this.wtfState.linePos.timer = _this.wtfState.lineCnt
      _this.wtfState.summary.serverCnt =
        _this.wtfState.lineCnt - _this.wtfState.linePos.socket

      // console.log(`Timers started on line ${_this.wtfState.lineCnt}`)
    }

    if (data.toString().includes('- Intervals:')) {
      // Record the number of Timers.
      _this.wtfState.linePos.interval = _this.wtfState.lineCnt
      _this.wtfState.summary.timerCnt =
        _this.wtfState.lineCnt - _this.wtfState.linePos.timer

      // console.log(`Intervals started on line ${_this.wtfState.lineCnt}`)
    }
  }

  // Returns a promise that resolves into CPU usage.
  getCpuUsage () {
    return new Promise((resolve) => {
      os.cpuUsage(function (v) {
        const v2 = bchjs.Util.floor8(v)
        return resolve(v2)
      })
    })
  }

  // Returns a promise that resolves into free CPU resources.
  getCpuFree () {
    return new Promise((resolve) => {
      os.cpuFree(function (v) {
        const v2 = bchjs.Util.floor8(v)
        return resolve(v2)
      })
    })
  }
}

module.exports = Analytics
