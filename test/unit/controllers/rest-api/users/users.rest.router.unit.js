/*
  Unit tests for the REST API handler for the /users endpoints.
*/

// Public npm libraries
import { assert } from 'chai'

import sinon from 'sinon'

// Local support libraries
import adapters from '../../../mocks/adapters/index.js'

import UseCasesMock from '../../../mocks/use-cases/index.js'

// const app = require('../../../mocks/app-mock')

import UserRouter from '../../../../../src/controllers/rest-api/users/index.js'

let uut
let sandbox
// let ctx

// const mockContext = require('../../../../unit/mocks/ctx-mock').context

describe('#Users-REST-Router', () => {
  // const testUser = {}

  beforeEach(() => {
    const useCases = new UseCasesMock()
    uut = new UserRouter({ adapters, useCases })

    sandbox = sinon.createSandbox()

    // Mock the context object.
    // ctx = mockContext()
  })

  afterEach(() => sandbox.restore())

  describe('#constructor', () => {
    it('should throw an error if adapters are not passed in', () => {
      try {
        uut = new UserRouter()

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Adapters library required when instantiating PostEntry REST Controller.'
        )
      }
    })

    it('should throw an error if useCases are not passed in', () => {
      try {
        uut = new UserRouter({ adapters })

        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(
          err.message,
          'Instance of Use Cases library required when instantiating PostEntry REST Controller.'
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

  describe('#createUser', () => {
    it('should ignore admin validator when DISABLE_NEW_ACCOUNTS is not defined', async () => {
      // Stub functions
      const validationSpy = sandbox.stub(uut.validators, 'ensureAdmin').resolves(true)
      sandbox.stub(uut.userRESTController, 'createUser').resolves(true)

      // Call function
      await uut.createUser()

      // Assertions
      assert.isTrue(validationSpy.notCalled, 'Admin validator should not be called')
    })
    it('should ensure admin when DISABLE_NEW_ACCOUNTS is defined', async () => {
      // Set environment variable
      process.env.DISABLE_NEW_ACCOUNTS = true

      // Stub functions
      const validationSpy = sandbox.stub(uut.validators, 'ensureAdmin').resolves(true)
      sandbox.stub(uut.userRESTController, 'createUser').resolves(true)

      // Call function
      await uut.createUser()

      // Assertions
      assert.isTrue(validationSpy.calledOnce, 'Admin validator should be called')
    })
  })
  describe('#getAll', () => {
    it('should route to controller', async () => {
      sandbox.stub(uut.validators, 'ensureUser').resolves(true)
      const spy = sandbox.stub(uut.userRESTController, 'getUsers').resolves(true)

      await uut.getAll()
      assert.isTrue(spy.calledOnce)
    })
  })
  describe('#getById', () => {
    it('should route to controller', async () => {
      sandbox.stub(uut.validators, 'ensureUser').resolves(true)
      const spy = sandbox.stub(uut.userRESTController, 'getUser').resolves(true)

      await uut.getById()
      assert.isTrue(spy.calledOnce)
    })
  })
  describe('#updateUser', () => {
    it('should route to controller', async () => {
      sandbox.stub(uut.validators, 'ensureTargetUserOrAdmin').resolves(true)
      sandbox.stub(uut.userRESTController, 'getUser').resolves(true)
      const spy = sandbox.stub(uut.userRESTController, 'updateUser').resolves(true)

      await uut.updateUser()
      assert.isTrue(spy.calledOnce)
    })
  })
  describe('#deleteUser', () => {
    it('should route to controller', async () => {
      sandbox.stub(uut.validators, 'ensureTargetUserOrAdmin').resolves(true)
      sandbox.stub(uut.userRESTController, 'getUser').resolves(true)
      const spy = sandbox.stub(uut.userRESTController, 'deleteUser').resolves(true)

      await uut.deleteUser()
      assert.isTrue(spy.calledOnce)
    })
  })
})
