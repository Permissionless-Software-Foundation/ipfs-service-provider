/*
  Unit tests for the use-cases/usage-use-cases.js business logic library.
*/

// Public npm libraries
import { assert } from 'chai'
import sinon from 'sinon'

// Local support libraries
import adapters from '../mocks/adapters/index.js'

// Mock
import { context as mockContext } from '../mocks/ctx-mock.js'

// Unit under test (uut)
import { UsageUseCases, restCalls, usageMiddleware } from '../../../src/use-cases/usage-use-cases.js'

describe('#usage-use-case', () => {
  let uut
  let sandbox
  let ctx

  before(async () => {

  })

  beforeEach(() => {
    sandbox = sinon.createSandbox()
    uut = new UsageUseCases({ adapters })

    // Set as empty array
    restCalls.splice(0, restCalls.length)

    ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new UsageUseCases()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of adapters must be passed in when instantiating Usage Use Cases library.'
        )
      }
    })
  })

  describe('#cleanUsage', () => {
    it('should delete older data than 24 hours', () => {
      const now = new Date() // Mock date

      // set older mock data
      restCalls.push({
        timestamp: now.getTime() - (60000 * 60 * 48), // 48 hours ago
        ip: '127.0.0.1'
      })

      // Set recently mock data
      restCalls.push({
        timestamp: now.getTime(),
        ip: 'localhost'
      })

      const result = uut.cleanUsage()

      assert.isArray(result)
      assert.equal(result.length, 1)
      assert.equal(result[0].ip, 'localhost')
    })

    it('should handle error', () => {
      try {
        // Force an error
        sandbox.stub(restCalls, 'filter').throws(new Error('uut error'))

        uut.cleanUsage()

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'uut error')
      }
    })
  })

  describe('#getRestSummary', () => {
    it('should get the number of rest calls', () => {
      // Set mock data
      restCalls.push({
        ip: 'localhost'
      })

      const result = uut.getRestSummary()

      assert.isNumber(result)
      assert.equal(result, 1)
    })

    it('should handle error', () => {
      try {
        // Force an error
        sandbox.stub(console, 'log').throws(new Error('uut error'))

        uut.getRestSummary()

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'uut error')
      }
    })
  })

  describe('#getTopIps', () => {
    it('should get top IPs', () => {
      // Set mock data
      restCalls.push({
        ip: 'localhost'
      })

      // Set mock data
      restCalls.push({
        ip: 'localhost'
      })

      const result = uut.getTopIps()

      assert.isArray(result)

      assert.property(result[0], 'ip')
      assert.property(result[0], 'cnt')

      assert.equal(result[0].ip, 'localhost')
      assert.equal(result[0].cnt, '2')
    })

    it('should return a maximum of 20 values', () => {
      //  Fill Array with 21 values
      for (let i = 0; i < 21; i++) {
        restCalls.push({
          ip: `localhost-${i}`
        })
      }

      const result = uut.getTopIps()

      assert.isArray(result)

      assert.property(result[0], 'ip')
      assert.property(result[0], 'cnt')

      assert.equal(result.length, 20)
    })

    it('should handle error', () => {
      try {
        // Set mock data
        restCalls.push(null)

        uut.getTopIps()

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Cannot read properties')
      }
    })
  })

  describe('#getTopEndpoints', () => {
    it('should get top Endpoints', () => {
      // Set mock data
      restCalls.push({
        ip: 'localhost',
        url: '/api/v1/users',
        method: 'GET'
      })

      // Set mock data
      restCalls.push({
        ip: 'localhost',
        url: '/api/v1/users',
        method: 'GET'
      })

      const result = uut.getTopEndpoints()

      assert.isArray(result)

      assert.property(result[0], 'endpoint')
      assert.property(result[0], 'cnt')

      assert.equal(result[0].endpoint, 'GET /api/v1/users')
      assert.equal(result[0].cnt, '2')
    })

    it('should return a maximum of 20 values', () => {
      //  Fill Array with 21 values
      for (let i = 0; i < 21; i++) {
        restCalls.push({
          ip: 'localhost',
          url: `/api/v1/users-${i}`,
          method: 'GET'
        })
      }

      const result = uut.getTopEndpoints()

      assert.isArray(result)

      assert.property(result[0], 'endpoint')
      assert.property(result[0], 'cnt')

      assert.equal(result.length, 20)
    })

    it('should handle error', () => {
      try {
        // Set mock data
        restCalls.push(null)

        uut.getTopEndpoints()

        assert.fail('Unexpected code path')
      } catch (error) {
        assert.include(error.message, 'Cannot read properties')
      }
    })
  })

  describe('#usageMiddleware', () => {
    it('should update restCalls state', async () => {
      // Spy on next
      const next = sinon.spy(() => { })

      await usageMiddleware()(ctx, next)

      assert.equal(restCalls.length, 1)
      assert.isTrue(next.called)
    })

    it('should handle error', async () => {
      try {
        const next = () => { throw new Error('uut error') }

        await usageMiddleware()(ctx, next)
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'uut error')
        assert.equal(ctx.status, 500)
        assert.equal(restCalls.length, 0)
      }
    })
  })
  describe('#clearUsage', () => {
    it('should clear the usage database data', async () => {
      const res = await uut.clearUsage()
      assert.isTrue(res)
    })

    it('should handle error', async () => {
      try {
        sandbox.stub(uut.UsageModel, 'deleteMany').throws(new Error('uut error'))
        await uut.clearUsage()
        assert.fail('Unexpected code path')
      } catch (error) {
        assert.equal(error.message, 'uut error')
      }
    })
  })

  describe('#saveUsage', () => {
    it('should save usage', async () => {
      // Set mock data
      restCalls.push({
        timestamp: new Date().getTime(),
        ip: 'localhost',
        url: 'fakeUrl',
        method: 'unit test'
      })
      const res = await uut.saveUsage()
      assert.isTrue(res)
    })

    it('should handle error', async () => {
      try {
        restCalls.push(null)
        await uut.saveUsage()
        assert.fail('Unexpected code path')
      } catch (error) {
        console.log(error)
        assert.include(error.message, 'Cannot read properties')
      }
    })
  })

  describe('#loadUsage', () => {
    it('should load usage', async () => {
      // Set mock data
      const mockObj = {
        timestamp: new Date().getTime(),
        ip: 'localhost',
        url: 'fakeUrl',
        method: 'unit test'
      }
      sandbox.stub(uut.UsageModel, 'find').returns(new Array(10).fill(null).map((_, i) => (mockObj)))
      const res = await uut.loadUsage()
      assert.equal(restCalls.length, 10)
      assert.equal(res.length, 10)
    })

    it('should skip error', async () => {
      sandbox.stub(uut.UsageModel, 'find').throws(new Error('uut error'))
      const res = await uut.loadUsage()
      assert.isFalse(res)
    })
  })
})
