/*
  REST API Controller library for the /ipfs route
*/

// Global npm libraries

// Local libraries
import wlogger from '../../../adapters/wlogger.js'

class IpfsRESTControllerLib {
  constructor (localConfig = {}) {
    // Dependency Injection.
    this.adapters = localConfig.adapters
    if (!this.adapters) {
      throw new Error(
        'Instance of Adapters library required when instantiating /ipfs REST Controller.'
      )
    }
    this.useCases = localConfig.useCases
    if (!this.useCases) {
      throw new Error(
        'Instance of Use Cases library required when instantiating /ipfs REST Controller.'
      )
    }

    // Encapsulate dependencies
    // this.UserModel = this.adapters.localdb.Users
    // this.userUseCases = this.useCases.user

    // Bind 'this' object to all subfunctions
    this.getStatus = this.getStatus.bind(this)
    this.getPeers = this.getPeers.bind(this)
    this.getRelays = this.getRelays.bind(this)
    this.handleError = this.handleError.bind(this)
    this.connect = this.connect.bind(this)
    this.getThisNode = this.getThisNode.bind(this)
  }

  /**
   * @api {get} /ipfs Get status on IPFS infrastructure
   * @apiPermission public
   * @apiName GetIpfsStatus
   * @apiGroup REST BCH
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5001/ipfs
   *
   */
  async getStatus (ctx) {
    try {
      const status = await this.adapters.ipfs.getStatus()

      ctx.body = { status }
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/getStatus(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {post} /ipfs/peers Get information on IPFS peers this node is connected to
   * @apiPermission public
   * @apiName GetIpfsPeers
   * @apiGroup REST IPFS
   *
   * @apiParam {Boolean} [showAll=false] Whether to include detailed peer data
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST localhost:5001/ipfs/peers \
   *   -d '{"showAll": false}'
   *
   * @apiSuccess {Object[]} peers Array of peer objects
   * @apiSuccess {String} peers[].peer Peer ID
   * @apiSuccess {String} peers[].name Peer name
   * @apiSuccess {String} peers[].protocol Protocol used by the peer
   * @apiSuccess {String} peers[].version Peer version
   * @apiSuccess {String} peers[].connectionAddr Connection address
   * @apiSuccess {Object} [peers[].peerData] Detailed peer data (when showAll=true)
   */
  async getPeers (ctx) {
    try {
      const showAll = ctx.request.body.showAll

      const peers = await this.adapters.ipfs.getPeers(showAll)

      ctx.body = { peers }
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/getPeers(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {post} /ipfs/relays Get data about the known Circuit Relays
   * @apiPermission public
   * @apiName GetIpfsRelays
   * @apiGroup REST IPFS
   *
   * @apiDescription Returns information about Circuit Relays, both v1 and v2, that this node knows about. V2 relays are hydrated with peer data from the connected peers list.
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST localhost:5001/ipfs/relays
   *
   * @apiSuccess {Object} relays Object containing relay information
   * @apiSuccess {Object[]} relays.v2Relays Array of v2 Circuit Relay objects
   * @apiSuccess {String} relays.v2Relays[].ipfsId IPFS ID of the relay
   * @apiSuccess {String} relays.v2Relays[].name Name of the relay (hydrated from peer data)
   * @apiSuccess {String} relays.v2Relays[].description Description of the relay (hydrated from peer data)
   * @apiSuccess {Object[]} relays.v1Relays Array of v1 Circuit Relay configurations
   */
  // Get data about the known Circuit Relays. Hydrate with data from peers list.
  async getRelays (ctx) {
    try {
      const relays = await this.adapters.ipfs.getRelays()

      ctx.body = { relays }
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/getRelays(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {post} /ipfs/connect Connect to a specific IPFS peer
   * @apiPermission public
   * @apiName ConnectToIpfsPeer
   * @apiGroup REST IPFS
   *
   * @apiDescription Attempts to establish a connection to a specific IPFS peer using the provided multiaddr. Optionally returns detailed information about the connection.
   *
   * @apiParam {String} multiaddr Multiaddress of the peer to connect to (required)
   * @apiParam {Boolean} [getDetails=false] Whether to return detailed connection information
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X POST localhost:5001/ipfs/connect \
   *   -d '{"multiaddr": "/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu", "getDetails": false}'
   *
   * @apiSuccess {Boolean} success Indicates whether the connection attempt was successful
   * @apiSuccess {Object} [details] Additional connection details (when getDetails=true)
   */
  async connect (ctx) {
    try {
      const multiaddr = ctx.request.body.multiaddr
      const getDetails = ctx.request.body.getDetails

      // console.log('this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs: ', this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs)
      const result = await this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs.connectToPeer({ multiaddr, getDetails })
      // console.log('result: ', result)

      ctx.body = result
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/connect():', err)
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  /**
   * @api {get} /ipfs/node Get a copy of the thisNode object from helia-coord
   * @apiPermission public
   * @apiName GetThisNode
   * @apiGroup REST BCH
   *
   * @apiExample Example usage:
   * curl -H "Content-Type: application/json" -X GET localhost:5001/ipfs/node
   *
   */
  async getThisNode (ctx) {
    try {
      const thisNode = this.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.thisNode

      ctx.body = { thisNode }
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/getThisNode(): ')
      // ctx.throw(422, err.message)
      this.handleError(ctx, err)
    }
  }

  // DRY error handler
  handleError (ctx, err) {
    // If an HTTP status is specified by the buisiness logic, use that.
    if (err.status) {
      if (err.message) {
        ctx.throw(err.status, err.message)
      } else {
        ctx.throw(err.status)
      }
    } else {
      // By default use a 422 error if the HTTP status is not specified.
      ctx.throw(422, err.message)
    }
  }
}

// module.exports = IpfsRESTControllerLib
export default IpfsRESTControllerLib
