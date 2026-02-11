/*
  Clean Architecture Adapter for IPFS.
  This library deals with IPFS so that the apps business logic doesn't need
  to have any specific knowledge of the js-ipfs library.

  Node creation is delegated to helia-coord's CreateHeliaNode factory,
  which encapsulates all helia/libp2p dependencies and configuration.
*/

// Global npm libraries
import CreateHeliaNode from 'helia-coord/create-helia-node'

// Local libraries
import config from '../../../config/index.js'
import JsonFiles from '../json-files.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

const IPFS_DIR = `${__dirname}../../../.ipfsdata/ipfs`

class IpfsAdapter {
  constructor (localConfig) {
    // Encapsulate dependencies
    this.config = config
    this.jsonFiles = new JsonFiles()

    // Properties of this class instance.
    this.isReady = false

    // Bind 'this' object to all subfunctions
    this.start = this.start.bind(this)
    this.stop = this.stop.bind(this)
    this.getSeed = this.getSeed.bind(this)
  }

  // Start an IPFS node.
  async start () {
    try {
      // Create the helia-coord node factory with production configuration.
      this.heliaNode = new CreateHeliaNode({
        ipfsDir: IPFS_DIR,
        tcpPort: this.config.ipfsTcpPort,
        wsPort: this.config.ipfsWsPort,
        isCircuitRelay: this.config.isCircuitRelay,
        getSeed: this.getSeed
      })

      // Start the IPFS node (creates dirs, libp2p, helia, detects public IP)
      const ipfs = await this.heliaNode.start()

      this.id = this.heliaNode.id
      this.multiaddrs = this.heliaNode.multiaddrs

      console.log('IPFS ID: ', this.id)
      console.log('Multiaddrs: ', this.multiaddrs)

      // Signal that this adapter is ready.
      this.isReady = true

      this.ipfs = ipfs

      return this.ipfs
    } catch (err) {
      console.error('Error in ipfs.js/start()')
      throw err
    }
  }

  async stop () {
    await this.ipfs.stop()

    return true
  }

  // This function opens the seed used to generate the key for this IPFS peer.
  // The seed is stored in a JSON file. If it doesn't exist, a new one is created.
  async getSeed () {
    try {
      let seed

      const filename = `${IPFS_DIR}/seed.json`

      try {
        // Try to read the JSON file containing the seed.
        seed = await this.jsonFiles.readJSON(filename)
      } catch (err) {
        const seedNum = Math.floor(Math.random() * 1000000000000000000000)
        seed = seedNum.toString()

        // Save the newly generated seed
        await this.jsonFiles.writeJSON(seed, filename)
      }

      return seed
    } catch (err) {
      console.error('Error in adapters/ipfs/ipfs.js/getSeed()')
      throw err
    }
  }
}

export default IpfsAdapter
