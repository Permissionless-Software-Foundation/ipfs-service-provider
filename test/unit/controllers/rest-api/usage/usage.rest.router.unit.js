/*
Unit tests for the REST API handler for the /usage endpoints.
*/

// Public npm libraries
import { assert } from 'chai'

import sinon from 'sinon'

// Local support libraries
import adapters from '../../../mocks/adapters/index.js'

import UseCasesMock from '../../../mocks/use-cases/index.js'

import UsageRouter from '../../../../../src/controllers/rest-api/usage/index.js'

let uut
let sandbox
// let ctx

// const mockContext = require('../../../../unit/mocks/ctx-mock').context

describe('#Usage-REST-Router', () => {
  beforeEach(() => {
    const useCases = new UseCasesMock()
    uut = new UsageRouter({ adapters, useCases })

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new UsageRouter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating IPFS REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new UsageRouter({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating IPFS REST Controller.'
        )
      }
    })
  })

  describe('#attach', () => {
    it('should throw an error if app is not passed in.', () => {
      try {
        uut.attach()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Must pass app object when attaching REST API controllers.'
        )
      }
    })
  })
})
