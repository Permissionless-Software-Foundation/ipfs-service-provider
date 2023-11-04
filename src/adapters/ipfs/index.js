/*
  top-level IPFS library that combines the individual IPFS-based libraries.
*/

// Local libraries
import IpfsAdapter from './ipfs.js'

import IpfsCoordAdapter from './ipfs-coord.js'
import config from '../../../config/index.js'

class IPFS {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.ipfsAdapter = new IpfsAdapter()
    this.IpfsCoordAdapter = IpfsCoordAdapter
    this.process = process
    this.config = config

    this.ipfsCoordAdapter = {} // placeholder

    // Properties of this class instance.
    this.isReady = false
  }

  // Provides a global start() function that triggers the start() function in
  // the underlying libraries.
  async start () {
    try {
      // Start IPFS
      await this.ipfsAdapter.start()
      console.log('IPFS is ready.')

      // this.ipfs is a Promise that will resolve into an instance of an IPFS node.
      this.ipfs = this.ipfsAdapter.ipfs

      // Start ipfs-coord
      this.ipfsCoordAdapter = new this.IpfsCoordAdapter({
        ipfs: this.ipfs,
        tcpPort: this.config.ipfsTcpPort,
        wsPort: this.config.ipfsWsPort
      })
      await this.ipfsCoordAdapter.start()
      console.log('ipfs-coord is ready.')

      // Subscribe to the chat pubsub channel
      await this.ipfsCoordAdapter.subscribeToChat()

      return true
    } catch (err) {
      console.error('Error in adapters/ipfs/index.js/start()')

      // If error is due to a lock file issue. Kill the process, so that
      // Docker or pm2 has a chance to restart the service.
      if (err.message.includes('Lock already being held')) {
        this.process.exit(1)
      }

      throw err
    }
  }

  // Get the status of this IPFS node.
  // Create an object with different metrics about this IPFS node, then return
  // the object.
  getStatus () {
    try {
      const statusObj = {
        ipfsId: this.ipfsCoordAdapter.ipfsCoord.thisNode.ipfsId,
        multiAddrs: this.ipfsCoordAdapter.ipfsCoord.thisNode.ipfsMultiaddrs,
        bchAddr: this.ipfsCoordAdapter.ipfsCoord.thisNode.bchAddr,
        slpAddr: this.ipfsCoordAdapter.ipfsCoord.thisNode.slpAddr,
        pubKey: this.ipfsCoordAdapter.ipfsCoord.thisNode.pubKey,
        peers: this.ipfsCoordAdapter.ipfsCoord.thisNode.peerList.length,
        relays: this.ipfsCoordAdapter.ipfsCoord.thisNode.relayData.length
      }

      return statusObj
    } catch (err) {
      console.error('Error in ipfs-coord.js/getStatus()')
      throw err
    }
  }

  // Get details on the other peers this node is connected to.
  async getPeers (showAll) {
    try {
      const peerData = this.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log(`peerData: ${JSON.stringify(peerData, null, 2)}`)

      let ipfsPeers =
        await this.ipfsCoordAdapter.ipfsCoord.adapters.ipfs.getPeers()
      // console.log('ipfsPeers: ', ipfsPeers)

      ipfsPeers = this._removeDuplicatePeers(ipfsPeers)
      // console.log('filtered ipfsPeers: ', ipfsPeers)

      const peerDataOut = []

      // Loop through each IPFS peer and hydrate it with data from the peerData.
      for (let i = 0; i < ipfsPeers.length; i++) {
        const thisPeer = {
          peer: ipfsPeers[i]
        }

        // if (!showAll) {
        //   // Delete properties that don't contain good info.
        //   delete thisPeer.muxer
        //   delete thisPeer.latency
        //   delete thisPeer.streams
        // }

        // Get the ipfs-coord peer data for this peer.
        let thisPeerData = peerData.filter((x) =>
          x.from.includes(thisPeer.peer)
        )
        thisPeerData = thisPeerData[0]
        // console.log('thisPeerData: ', thisPeerData)

        // Skip if peerData for this IPFS peer could not be found.
        // if (!thisPeerData) continue

        try {
          // console.log('thisPeerData: ', thisPeerData)

          // Add data to the IPFS peer data.
          thisPeer.name = thisPeerData.data.jsonLd.name
          thisPeer.protocol = thisPeerData.data.jsonLd.protocol
          thisPeer.version = thisPeerData.data.jsonLd.version
          thisPeer.connectionAddr = thisPeerData.data.connectionAddr

          if (showAll) {
            // Add all the peer data.
            thisPeer.peerData = thisPeerData
          }
        } catch (err) {
          console.warn(
            `warning: ${thisPeer.peer}: ${err.message}`
          )
        }

        peerDataOut.push(thisPeer)
      }

      return peerDataOut
    } catch (err) {
      console.error('Error in getPeers(): ', err)
      throw err
    }
  }

  // Expects an array of peers and returns an array of peers with duplicates
  // removed.
  // This function is used by getPeers()
  _removeDuplicatePeers (arr) {
    // https://stackoverflow.com/questions/2218999/how-to-remove-all-duplicates-from-an-array-of-objects
    return arr.filter((v, i, a) => a.findIndex((t) => t === v) === i)
  }

  // Get data about the known Circuit Relays. Hydrate with data from peers list.
  getRelays () {
    try {
      const relayData = this.ipfsCoordAdapter.ipfsCoord.thisNode.relayData
      const peerData = this.ipfsCoordAdapter.ipfsCoord.thisNode.peerData
      // console.log(`relayData: ${JSON.stringify(relayData, null, 2)}`)
      // console.log(`peerData: ${JSON.stringify(peerData, null, 2)}`)

      for (let i = 0; i < relayData.length; i++) {
        const thisRelay = relayData[i]

        // Find the peer that corresponds to this relay.
        const thisPeer = peerData.filter((x) =>
          x.from.includes(thisRelay.ipfsId)
        )
        // console.log('thisPeer: ', thisPeer)

        // If the peer couldn't be found, skip.
        if (!thisPeer.length) {
          thisRelay.name = ''
          thisRelay.description = ''
          continue
        }

        thisRelay.name = thisPeer[0].data.jsonLd.name
        thisRelay.description = thisPeer[0].data.jsonLd.description
      }

      const v1Relays = this.config.v1Relays

      return { v2Relays: relayData, v1Relays }
    } catch (err) {
      console.error('Error in getRelays(): ', err)
      throw err
    }
  }
}

export default IPFS
