/*
Unit tests for the REST API middleware that handle response errors.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local libraries
import errorMiddleware from '../../../../../src/controllers/rest-api/middleware/error.js'
import { context as mockContext } from '../../../../unit/mocks/ctx-mock.js'

describe('#Validators', () => {
  let ctx
  let sandbox

  beforeEach(() => {
    // Mock the context object.
    ctx = mockContext()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#errorMiddleware', () => {
    it('should run next function', async () => {
      // Spy on next
      const next = sinon.spy(() => { })
      errorMiddleware()(ctx, next)

      assert.isTrue(next.calledOnce)
    })

    it('should handle unknown status error', async () => {
      try {
        const next = async () => {
          const e = new Error('test error')
          e.status = null
          throw e
        }

        await errorMiddleware()(ctx, next)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(ctx.status, 500)
        assert.equal(ctx.body, 'test error')
      }
    })
    it('should handle known status error', async () => {
      try {
        const next = async () => {
          const e = new Error('test error')
          e.status = 422
          throw e
        }

        await errorMiddleware()(ctx, next)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(ctx.status, 422)
        assert.equal(ctx.body, 'test error')
      }
    })
  })
})
