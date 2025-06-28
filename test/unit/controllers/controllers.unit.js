/*
  Unit tests for controllers index.js file.
*/

// Public npm libraries
// const assert = require('chai').assert
import sinon from 'sinon'

import Controllers from '../../../src/controllers/index.js'

describe('#Controllers', () => {
  let uut
  let sandbox

  beforeEach(() => {
    sandbox = sinon.createSandbox()

    uut = new Controllers()
  })

  afterEach(() => sandbox.restore())

  describe('#attachControllers', () => {
    it('should attach the controllers', async () => {
      // mock IPFS
      sandbox.stub(uut.adapters, 'start').resolves({})
      uut.adapters.ipfs.ipfsCoordAdapter = {
        attachRPCRouter: () => {}
      }

      // Mock the timer controllers
      sandbox.stub(uut.timerControllers, 'startTimers').returns()

      const app = {
        use: () => {}
      }

      await uut.attachControllers(app)
    })
  })
  describe('#attachRESTControllers', () => {
    it('should attach the controllers', async () => {
      const app = {
        use: () => {}
      }

      await uut.attachRESTControllers(app)
    })
  })
  describe('#initAdapters', () => {
    it('should attach the controllers', async () => {
      sandbox.stub(uut.adapters, 'start').resolves({})
      await uut.initAdapters()
    })
  })
  describe('#initUseCases', () => {
    it('should attach the controllers', async () => {
      sandbox.stub(uut.useCases, 'start').resolves({})
      await uut.initUseCases()
    })
  })
})
