/*
  Unit tests for the REST API handler for the /ipfs endpoints.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import IpfsApiController from '../../../../../src/controllers/rest-api/ipfs/controller.js'
import adapters from '../../../mocks/adapters/index.js'
import UseCasesMock from '../../../mocks/use-cases/index.js'

import { context as mockContext } from '../../../mocks/ctx-mock.js'
let uut
let sandbox
let ctx

describe('#IPFS REST API', () => {
  before(async () => {
  })

  beforeEach(() => {
    const useCases = new UseCasesMock()

    uut = new IpfsApiController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new IpfsApiController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /ipfs REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new IpfsApiController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /ipfs REST Controller.'
        )
      }
    })
  })

  describe('#GET /status', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.adapters.ipfs, 'getStatus').rejects(new Error('test error'))

        await uut.getStatus(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters.ipfs, 'getStatus').resolves({ a: 'b' })

      await uut.getStatus(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'status')
      assert.equal(ctx.body.status.a, 'b')
    })
  })

  describe('#POST /peers', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.adapters.ipfs, 'getPeers').rejects(new Error('test error'))

        ctx.request.body = {
          showAll: true
        }

        await uut.getPeers(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters.ipfs, 'getPeers').resolves({ a: 'b' })

      ctx.request.body = {
        showAll: true
      }

      await uut.getPeers(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'peers')
      assert.equal(ctx.body.peers.a, 'b')
    })
  })

  describe('#POST /relays', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.adapters.ipfs, 'getRelays').rejects(new Error('test error'))

        await uut.getRelays(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters.ipfs, 'getRelays').resolves({ a: 'b' })

      await uut.getRelays(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'relays')
      assert.equal(ctx.body.relays.a, 'b')
    })
  })

  describe('#POST /connect', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs, 'connectToPeer').rejects(new Error('test error'))

        ctx.request.body = {
          multiaddr: '/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu'
        }

        await uut.connect(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      // Mock dependencies
      sandbox.stub(uut.adapters.ipfs.ipfsCoordAdapter.ipfsCoord.adapters.ipfs, 'connectToPeer').resolves({ success: true })

      ctx.request.body = {
        multiaddr: '/ip4/161.35.99.207/tcp/4001/p2p/12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu'
      }

      await uut.connect(ctx)
      // console.log('ctx.body: ', ctx.body)

      assert.property(ctx.body, 'success')
      assert.equal(ctx.body.success, true)
    })
  })

  describe('#handleError', () => {
    it('should still throw error if there is no message', () => {
      try {
        const err = {
          status: 404
        }

        uut.handleError(ctx, err)
      } catch (err) {
        assert.include(err.message, 'Not Found')
      }
    })

    it('should throw error with message', () => {
      try {
        const err = {
          status: 422,
          message: 'test error'
        }

        uut.handleError(ctx, err)
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })
})
