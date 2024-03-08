/*
  REST API Controller library for the /ipfs route
*/

// Global npm libraries
import { exporter } from 'ipfs-unixfs-exporter'
import fs from 'fs'

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
    this.fs = fs

    // Bind 'this' object to all subfunctions
    this.getStatus = this.getStatus.bind(this)
    this.getPeers = this.getPeers.bind(this)
    this.getRelays = this.getRelays.bind(this)
    this.handleError = this.handleError.bind(this)
    this.connect = this.connect.bind(this)
    this.getThisNode = this.getThisNode.bind(this)
    this.downloadFile = this.downloadFile.bind(this)
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

  // Return information on IPFS peers this node is connected to.
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

  async downloadFile (ctx) {
    try {
      // const { cid } = ctx.params

      // const multiaddr = ctx.request.body.multiaddr
      // const getDetails = ctx.request.body.getDetails
      const { cid, fileName, path } = ctx.request.body

      console.log(`downloadFile() retrieving this CID: ${cid}, with fileName: ${fileName}, and path: ${path}`)

      // const file = await this.adapters.ipfs.ipfs.blockstore.get(cid)
      // console.log('file: ', file)
      // return file

      // const ipfsFs = this.adapters.ipfs.ipfs.fs
      // console.log('ipfsFs: ', ipfsFs)
      //
      // const buf = []
      // for await (const chunk of ipfsFs.cat(cid)) {
      //   // text += decoder.decode(chunk, {
      //   //   stream: true
      //   // })
      //
      //   buf.push(chunk)
      // }
      // console.log(`buf: `, buf)

      const blockstore = this.adapters.ipfs.ipfs.blockstore
      const entry = await exporter(cid, blockstore)

      console.info(entry.cid) // Qmqux
      console.info(entry.path) // Qmbaz/foo/bar.txt
      console.info(entry.name) // bar.txt
      console.log('entry: ', entry)
      // console.info(entry.unixfs.fileSize()) // 4

      // stream content from unixfs node
      // const bytes = new Uint8Array(Number(entry.size))
      // let offset = 0

      const filePath = `${path}/${fileName}`
      const writableStream = fs.createWriteStream(filePath)

      writableStream.on('error', (error) => {
        console.log(`An error occured while writing to the file. Error: ${error.message}`)
      })

      writableStream.on('finish', () => {
        console.log(`CID ${cid} downloaded to ${filePath}`)
      })

      for await (const buf of entry.content()) {
        // bytes.set(buf, offset)
        // offset += buf.length

        writableStream.write(buf)
      }

      writableStream.end()

      // console.info(bytes) // 0, 1, 2, 3

      ctx.body = {
        success: true
      }
    } catch (err) {
      wlogger.error('Error in ipfs/controller.js/downloadFile(): ', err)
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
