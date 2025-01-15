/*
  Unit tests for the REST API handler for the /usage endpoints.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local support libraries
import adapters from '../../../mocks/adapters/index.js'
import UseCasesMock from '../../../mocks/use-cases/index.js'
import UsageController from '../../../../../src/controllers/rest-api/usage/controller.js'

import { context as mockContext } from '../../../mocks/ctx-mock.js'

let uut
let sandbox
let ctx

describe('#Usage-REST-Controller', () => {
  // const testUser = {}

  beforeEach(() => {
    const useCases = new UseCasesMock()
    uut = new UsageController({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new UsageController()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating /usage REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new UsageController({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating /usage REST Controller.'
        )
      }
    })
  })

  describe('#Get /usage', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        sandbox.stub(uut.useCases.usage, 'getRestSummary').throws(new Error('test error'))
        await uut.getStatus(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      await uut.getStatus(ctx)

      // Assert the expected HTTP response
      assert.equal(ctx.status, 200)

      // Assert that expected properties exist in the returned data.
      assert.property(ctx.response.body, 'status')
    })
  })

  describe('#Get /ips', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        sandbox.stub(uut.useCases.usage, 'getTopIps').throws(new Error('test error'))
        await uut.getTopIps(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      await uut.getTopIps(ctx)

      // Assert the expected HTTP response
      assert.equal(ctx.status, 200)

      // Assert that expected properties exist in the returned data.
      assert.property(ctx.response.body, 'ips')
    })
  })

  describe('#Get /endpoints', () => {
    it('should return 422 status on biz logic error', async () => {
      try {
        sandbox.stub(uut.useCases.usage, 'getTopEndpoints').throws(new Error('test error'))
        await uut.getTopEndpoints(ctx)

        assert.fail('Unexpected result')
      } catch (err) {
        // console.log(err)
        assert.equal(err.status, 422)
        assert.include(err.message, 'test error')
      }
    })

    it('should return 200 status on success', async () => {
      await uut.getTopEndpoints(ctx)

      // Assert the expected HTTP response
      assert.equal(ctx.status, 200)

      // Assert that expected properties exist in the returned data.
      assert.property(ctx.response.body, 'endpoints')
    })
  })

  describe('#handleError', () => {
    it('should pass an error message', () => {
      try {
        const err = {
          status: 422,
          message: 'Unprocessable Entity'
        }

        uut.handleError(ctx, err)
      } catch (err) {
        assert.include(err.message, 'Unprocessable Entity')
      }
    })
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
  })
})
