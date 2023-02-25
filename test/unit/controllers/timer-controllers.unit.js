/*
  Unit tests for the timer-controller.js Controller library
*/

// Public npm libraries
const { assert } = require('chai')
const sinon = require('sinon')

// Local libraries
const TimerControllers = require('../../../src/controllers/timer-controllers.js')
const adapters = require('../mocks/adapters/index.js')
const UseCasesMock = require('../mocks/use-cases/index.js')

describe('#Timer-Controllers', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    const useCases = new UseCasesMock()
    uut = new TimerControllers({ adapters, useCases })
  })

  afterEach(() => {
    sandbox.restore()

    uut.stopTimers()
  })

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new TimerControllers()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating Timer Controller libraries.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new TimerControllers({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating Timer Controller libraries.'
        )
      }
    })
  })

  describe('#exampleTimerFunc', () => {
    it('should kick off the Use Case', async () => {
      const result = await uut.exampleTimerFunc()

      assert.equal(result, true)
    })

    it('should return false on error', async () => {
      const result = await uut.exampleTimerFunc(true)

      assert.equal(result, false)
    })
  })
})
