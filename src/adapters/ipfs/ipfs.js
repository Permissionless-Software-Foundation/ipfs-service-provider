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
import { identify } from '@libp2p/identify'
// import { circuitRelayServer, circuitRelayTransport } from 'libp2p/circuit-relay'
import { circuitRelayServer, circuitRelayTransport } from '@libp2p/circuit-relay-v2'
import { gossipsub } from '@chainsafe/libp2p-gossipsub'
import { webSockets } from '@libp2p/websockets'
import publicIp from 'public-ip'
import { multiaddr } from '@multiformats/multiaddr'
import { webRTC } from '@libp2p/webrtc'

// Local libraries
import config from '../../../config/index.js'

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
    this.publicIp = publicIp
    this.multiaddr = multiaddr

    // Properties of this class instance.
    this.isReady = false

    // Bind 'this' object to all subfunctions
    this.start = this.start.bind(this)
    this.createNode = this.createNode.bind(this)
    this.stop = this.stop.bind(this)
    this.ensureBlocksDir = this.ensureBlocksDir.bind(this)
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
      const ip4 = await this.publicIp.v4()
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

  // This function creates an IPFS node using Helia.
  // It returns the node as an object.
  async createNode () {
    try {
      // Create block and data stores.
      const blockstore = new FsBlockstore(`${IPFS_DIR}/blockstore`)
      const datastore = new FsDatastore(`${IPFS_DIR}/datastore`)

      // Configure services
      const services = {
        identify: identify(),
        pubsub: gossipsub({ allowPublishToZeroPeers: true })
      }
      if (this.config.isCircuitRelay) {
        console.log('Helia (IPFS) node IS configured as Circuit Relay')
        services.relay = circuitRelayServer()
      } else {
        console.log('Helia (IPFS) node IS NOT configured as Circuit Relay')
      }

      // const bootstrapList = [
      //   //
      //   // // launchpad-p2wdb-service (Launchpad pinning service)
      //   // '/ip4/137.184.13.92/tcp/4001/p2p/12D3KooWPpBXhhAeoCZCGuQ3KR4xwHzzvtP57f6zLmo8P7ZFBJFE',
      //   //
      //   // // PSFoundation.info metrics
      //   // '/ip4/5.161.72.148/tcp/4001/p2p/12D3KooWDL1kPixc6hcT4s7teWGufrxXmZFD1kPeGdDrsKgYrFUt',
      //   //
      //   // // PSFoundation.info P2WDB
      //   // '/ip4/5.161.72.148/tcp/4101/p2p/12D3KooWHz1sRB94EEVRQRJvUX9MyRm3xhr4QSyCoJbTdu2AYheq',
      //   //
      //   // // TokenTiger.com backup P2WDB
      //   // '/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu',
      //   //
      //   // // helia-p2wdb-dev-server-01 prototype P2WDB server using Helia (Token Tiger)
      //   // '/ip4/137.184.93.145/tcp/4001/p2p/12D3KooWGZCpD5Ue3CJCBBEKowcuKEgeVKbTM7VMbJ8xm1bqST1j',
      //   //
      //   // // helia-p2wdb-dev-server-01 prototype P2WDB server using Helia (FullStack.cash)
      //   // '/ip4/78.46.129.7/tcp/7001/p2p/12D3KooWRqe7TwTj8apPxmpPqPgHiv7qv5YBJTo1VeQ7zrdyA2HN'
      // ]
      // bootstrapList = bootstrapList.concat(this.config.bootstrapRelays)
      // console.log('bootstrapList: ', bootstrapList)

      // libp2p is the networking layer that underpins Helia
      const libp2p = await this.createLibp2p({
        datastore,
        addresses: {
          listen: [
            '/ip4/127.0.0.1/tcp/0',
            `/ip4/0.0.0.0/tcp/${this.config.ipfsTcpPort}`,
            `/ip4/0.0.0.0/tcp/${this.config.ipfsWsPort}/ws`,
            '/webrtc'
          ]
        },
        transports: [
          tcp(),
          webSockets(),
          circuitRelayTransport({ discoverRelays: 3 }),
          webRTC()
        ],
        connectionEncryption: [
          noise()
        ],
        streamMuxers: [
          yamux()
        ],
        // peerDiscovery: [
        //   bootstrap({
        //     list: bootstrapList
        //   })
        // ],
        services
      })

      // console.log(`Node started with id ${libp2p.peerId.toString()}`)
      // console.log('Listening on:')
      // libp2p.getMultiaddrs().forEach((ma) => console.log(ma.toString()))

      // create a Helia node
      const helia = await createHelia({
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
}

export default IpfsAdapter
