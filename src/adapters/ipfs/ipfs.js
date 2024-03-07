/*
  Clean Architecture Adapter for IPFS.
  This library deals with IPFS so that the apps business logic doesn't need
  to have any specific knowledge of the js-ipfs library.

  TODO: Add the external IP address to the list of multiaddrs advertised by
  this node. See this GitHub Issue for details:
  https://github.com/Permissionless-Software-Foundation/ipfs-service-provider/issues/38
*/

// Global npm libraries
import { createHelia } from 'helia'
import fs from 'fs'
import { FsBlockstore } from 'blockstore-fs'
import { FsDatastore } from 'datastore-fs'
import { createLibp2p } from 'libp2p'
import { tcp } from '@libp2p/tcp'
import { noise } from '@chainsafe/libp2p-noise'
import { yamux } from '@chainsafe/libp2p-yamux'
// import { bootstrap } from '@libp2p/bootstrap'
// import { identifyService } from 'libp2p/identify'
import { identify } from '@libp2p/identify'
// import { circuitRelayServer, circuitRelayTransport } from 'libp2p/circuit-relay'
import { circuitRelayServer, circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import { publicIpv4 } from 'public-ip'
import { multiaddr } from '@multiformats/multiaddr'
import { webRTC } from '@libp2p/webrtc'
import { keychain } from '@libp2p/keychain'
import { defaultLogger } from '@libp2p/logger'

// Local libraries
import config from '../../../config/index.js'
import JsonFiles from '../json-files.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
// console.log('__dirname: ', __dirname)

const ROOT_DIR = `${__dirname}../../../`
const IPFS_DIR = `${__dirname}../../../.ipfsdata/ipfs`

class IpfsAdapter {
  constructor (localConfig) {
    // Encapsulate dependencies
    this.config = config
    this.fs = fs
    this.createLibp2p = createLibp2p
    this.publicIp = publicIpv4
    this.multiaddr = multiaddr
    this.jsonFiles = new JsonFiles()
    this.keychain = keychain
    this.createHelia = createHelia

    // Properties of this class instance.
    this.isReady = false

    // Bind 'this' object to all subfunctions
    this.start = this.start.bind(this)
    this.createNode = this.createNode.bind(this)
    this.stop = this.stop.bind(this)
    this.ensureBlocksDir = this.ensureBlocksDir.bind(this)
    this.getSeed = this.getSeed.bind(this)
    this.getKeychain = this.getKeychain.bind(this)
  }

  // Start an IPFS node.
  async start () {
    try {
      // Ensure the directory structure exists that is needed by the IPFS node to store data.
      this.ensureBlocksDir()

      // Create an IPFS node
      const ipfs = await this.createNode()
      // console.log('ipfs: ', ipfs)

      this.id = ipfs.libp2p.peerId.toString()
      console.log('IPFS ID: ', this.id)

      // Attempt to guess our ip4 IP address.
      const ip4 = await this.publicIp()
      let detectedMultiaddr = `/ip4/${ip4}/tcp/${this.config.ipfsTcpPort}/p2p/${this.id}`
      detectedMultiaddr = this.multiaddr(detectedMultiaddr)

      // Get the multiaddrs for the node.
      const multiaddrs = ipfs.libp2p.getMultiaddrs()
      multiaddrs.push(detectedMultiaddr)
      console.log('Multiaddrs: ', multiaddrs)

      this.multiaddrs = multiaddrs

      // Signal that this adapter is ready.
      this.isReady = true

      this.ipfs = ipfs

      return this.ipfs
    } catch (err) {
      console.error('Error in ipfs.js/start()')

      // If IPFS crashes because the /blocks directory is full, wipe the directory.
      // if (err.message.includes('No space left on device')) {
      //   this.rmBlocksDir()
      // }

      throw err
    }
  }

  async getKeychain (datastore) {
    const keychainInit = {
      pass: await this.getSeed()
    }

    const chain = this.keychain(keychainInit)({
      datastore,
      logger: defaultLogger()
    })

    return chain
  }

  // This function creates an IPFS node using Helia.
  // It returns the node as an object.
  async createNode () {
    try {
      // Create block and data stores.
      const blockstore = new FsBlockstore(`${IPFS_DIR}/blockstore`)
      const datastore = new FsDatastore(`${IPFS_DIR}/datastore`)

      // const keychainInit = {
      //   pass: await this.getSeed()
      // }

      // Create an identity
      let peerId
      // console.log('this.keychain: ', this.keychain)
      // const chain = this.keychain(keychainInit)({
      //   datastore,
      //   logger: defaultLogger()
      // })
      const chain = await this.getKeychain(datastore)
      try {
        peerId = await chain.exportPeerId('myKey')
      } catch (err) {
        await chain.createKey('myKey', 'Ed25519', 4096)
        peerId = await chain.exportPeerId('myKey')
      }

      // Configure services
      const services = {
        identify: identify(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true })
      }
      if (this.config.isCircuitRelay) {
        console.log('Helia (IPFS) node IS configured as Circuit Relay')
        services.relay = circuitRelayServer({ // makes the node function as a relay server
          hopTimeout: 30 * 1000, // incoming relay requests must be resolved within this time limit
          advertise: true,
          reservations: {
            maxReservations: 15, // how many peers are allowed to reserve relay slots on this server
            reservationClearInterval: 300 * 1000, // how often to reclaim stale reservations
            applyDefaultLimit: true, // whether to apply default data/duration limits to each relayed connection
            defaultDurationLimit: 2 * 60 * 1000, // the default maximum amount of time a relayed connection can be open for
            defaultDataLimit: BigInt(2 << 7), // the default maximum number of bytes that can be transferred over a relayed connection
            maxInboundHopStreams: 32, // how many inbound HOP streams are allow simultaneously
            maxOutboundHopStreams: 64 // how many outbound HOP streams are allow simultaneously
          }
        })
      } else {
        console.log('Helia (IPFS) node IS NOT configured as Circuit Relay')
      }

      // Configure transports
      let transports
      if (process.env.CONNECT_PREF === 'direct') {
        transports = [
          tcp(),
          webSockets(),
          webRTC()
        ]
      } else {
        transports = [
          tcp(),
          webSockets(),
          circuitRelayTransport({
            discoverRelays: 3,
            reservationConcurrency: 3
          }),
          webRTC()
        ]
      }

      // libp2p is the networking layer that underpins Helia
      const libp2p = await this.createLibp2p({
        peerId,
        datastore,
        addresses: {
          listen: [
            '/ip4/127.0.0.1/tcp/0',
            `/ip4/0.0.0.0/tcp/${this.config.ipfsTcpPort}`,
            `/ip4/0.0.0.0/tcp/${this.config.ipfsWsPort}/ws`,
            '/webrtc'
          ]
        },
        transports,
        connectionEncryption: [
          noise()
        ],
        streamMuxers: [
          yamux()
        ],
        services
      })

      // create a Helia node
      const helia = await this.createHelia({
        blockstore,
        datastore,
        libp2p
      })

      return helia
    } catch (err) {
      console.error('Error creating Helia node: ', err)

      throw err
    }
  }

  async stop () {
    await this.ipfs.stop()

    return true
  }

  // Ensure that the directories exist to store blocks from the IPFS network.
  // This function is called at startup, before the IPFS node is started.
  ensureBlocksDir () {
    try {
      !this.fs.existsSync(`${ROOT_DIR}.ipfsdata`) && this.fs.mkdirSync(`${ROOT_DIR}.ipfsdata`)

      !this.fs.existsSync(`${IPFS_DIR}`) && this.fs.mkdirSync(`${IPFS_DIR}`)

      !this.fs.existsSync(`${IPFS_DIR}/blockstore`) && this.fs.mkdirSync(`${IPFS_DIR}/blockstore`)

      !this.fs.existsSync(`${IPFS_DIR}/datastore`) && this.fs.mkdirSync(`${IPFS_DIR}/datastore`)

      return true
    } catch (err) {
      console.error('Error in adapters/ipfs.js/ensureBlocksDir(): ', err)
      throw err
    }
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

      // console.log('getSeed() seed: ', seed)

      return seed
    } catch (err) {
      console.error('Error in adapters/ipfs/ipfs.js/getSeed()')
      throw err
    }
  }
}

export default IpfsAdapter
