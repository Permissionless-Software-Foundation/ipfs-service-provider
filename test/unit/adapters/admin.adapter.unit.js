import { assert } from 'chai'
import Admin from '../../../src/adapters/admin.js'
import sinon from 'sinon'
import util from 'util'
import config from '../../../config/index.js'

util.inspect.defaultOptions = { depth: 1 }

let sandbox
let uut
describe('Admin', () => {
  beforeEach(() => {
    uut = new Admin()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  if (!config.noMongo) {
    describe('loginAdmin()', () => {
      it('should login admin', async () => {
        try {
          sandbox.stub(uut.jsonFiles, 'readJSON').resolves({ password: 'pass' })
          sandbox.stub(uut.axios, 'request').resolves(true)

          const result = await uut.loginAdmin()
          assert.isTrue(result)
        } catch (err) {
          assert(false, 'Unexpected result')
        }
      })

      it('should handle axios error', async () => {
        try {
          // Returns an erroneous password to force
          // an auth error
          sandbox.stub(uut.axios, 'request').throws(new Error('test error'))
          sandbox.stub(uut.jsonFiles, 'readJSON').resolves({ password: 'wrong' })

          await uut.loginAdmin()
          assert(false, 'Unexpected result')
        } catch (err) {
          assert.include(err.message, 'test error')
        }
      })
    })

    describe('createSystemUser()', () => {
      it('should create admin', async () => {
        try {
          await uut.deleteExistingSystemUser()
          const result = await uut.createSystemUser()

          assert.property(result, 'email')
          assert.property(result, 'password')
          assert.property(result, 'id')
          assert.property(result, 'token')
        } catch (err) {
          assert(false, 'Unexpected result')
        }
      })
      it('should update admin password', async () => {
        try {
          uut.config.adminPassword = 'newpassword'

          const fakeUser = {
            password: 'oldpassword',
            save: () => { return 'token' },
            generateToken: () => { return 'token' }
          }

          sandbox.stub(uut.User, 'findOne').resolves(fakeUser)
          sandbox.stub(uut.jsonFiles, 'writeJSON').resolves(true)
          const result = await uut.createSystemUser()

          assert.property(result, 'email')
          assert.property(result, 'password')
          assert.property(result, 'id')
          assert.property(result, 'token')

          assert.equal(fakeUser.password, 'newpassword', 'password should be updated')
        } catch (err) {
          console.log(err)
          assert(false, 'Unexpected result')
        }
      })

      it('should handle error', async () => {
        try {
          sandbox.stub(uut.User, 'findOne').throws(new Error('test error'))
          await uut.createSystemUser()
          assert.fail('Unexpected result')
        } catch (err) {
          assert.include(err.message, 'test error')
        }
      })
    })

    describe('deleteExistingSystemUser()', () => {
      it('should delete admin', async () => {
        try {
          sandbox.stub(uut.User, 'deleteOne').resolves(true)
          const result = await uut.deleteExistingSystemUser()
          assert.isTrue(result)
        } catch (err) {
          assert(false, 'Unexpected result')
        }
      })

      it('should handle error when deleting admin', async () => {
        try {
          sandbox.stub(uut.User, 'deleteOne').throws(new Error('test error'))
          await uut.deleteExistingSystemUser()
          assert.fail('Unexpected result')
        } catch (err) {
          assert.include(err.message, 'test error')
        }
      })
    })
  }
})
