const assert = require('chai').assert

const sinon = require('sinon')

const util = require('util')
util.inspect.defaultOptions = { depth: 1 }

const LogsApiLib = require('../../../src/adapters/logapi')
const mockData = require('../mocks/log-api-mock')

const context = {}
let sandbox
let uut
describe('#LogsApiLib', () => {
  beforeEach(() => {
    uut = new LogsApiLib()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#getLogs()', () => {
    it('should return false if password is not provided', async () => {
      try {
        const result = await uut.getLogs()
        assert.property(result, 'success')
        assert.isFalse(result.success)
      } catch (err) {
        assert(false, 'Unexpected result')
      }
    })

    it('should return log', async () => {
      // Mock dependencies
      sandbox.stub(uut, 'generateFileName').returns(`${__dirname.toString()}/../mocks/adapters/fake-log`)

      const pass = 'test'
      const result = await uut.getLogs(pass)
      // console.log('result', result)

      assert.isTrue(result.success)
      assert.isArray(result.data)
      assert.property(result.data[0], 'message')
      assert.property(result.data[0], 'level')
      assert.property(result.data[0], 'timestamp')
    })

    it('should return false if files are not found!', async () => {
      try {
        sandbox.stub(uut, 'generateFileName').resolves('bad router')

        const password = 'test'

        const result = await uut.getLogs(password)
        // console.log(result)

        assert.isFalse(result.success)
        assert.include(result.data, 'file does not exist')
      } catch (err) {
        console.log('ERRROR', err)
        assert.fail('Unexpected result')
      }
    })

    it('should catch and handle errors', async () => {
      try {
        // Force an error
        sandbox.stub(uut.fs, 'existsSync').throws(new Error('test error'))
        const password = 'test'

        await uut.getLogs(password)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })

    it('should throw unhandled error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.fs, 'existsSync').throws(new Error('Unhandled error'))
        const password = 'test'

        await uut.getLogs(password)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Unhandled error')
      }
    })
  })

  describe('#filterLogs()', () => {
    it('should throw error if data is not provided', async () => {
      try {
        await uut.filterLogs()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Data must be array')
      }
    })

    it('should throw error if data provided is not an array', async () => {
      try {
        const data = 'data'
        await uut.filterLogs(data)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'Data must be array')
      }
    })

    it('should sort the log data', async () => {
      try {
        const data = mockData.data
        const result = await uut.filterLogs(data)
        assert.isArray(result)
        assert.property(result[1], 'message')
        assert.property(result[1], 'level')
        assert.property(result[1], 'timestamp')
      } catch (err) {
        assert.fail('Unexpected result')
      }
    })

    it('should sort the log data with a limit', async () => {
      try {
        const data = mockData.data
        const limit = 1
        const result = await uut.filterLogs(data, limit)
        assert.isArray(result)
        assert.equal(result.length, limit)
        assert.property(result[0], 'message')
        assert.property(result[0], 'level')
        assert.property(result[0], 'timestamp')
      } catch (err) {
        assert.fail('Unexpected result')
      }
    })
  })

  describe('#generateFileName()', () => {
    it('should return file name', async () => {
      try {
        const fileName = await uut.generateFileName()
        assert.isString(fileName)
        context.fileName = fileName
      } catch (err) {
        assert.fail('Unexpected result')
      }
    })

    it('should throw error if something fails', async () => {
      try {
        uut.config = null
        await uut.generateFileName()
        assert.fail('Unexpected result')
      } catch (err) {
        assert.exists(err)
        assert.isString(err.message)
      }
    })
  })

  describe('#readLines()', () => {
    it('should throw error if fileName is not provided', async () => {
      try {
        await uut.readLines()

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'filename must be a string')
      }
    })

    it('should throw error if fileName provided is not string', async () => {
      try {
        const fileName = true
        await uut.readLines(fileName)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'filename must be a string')
      }
    })

    it('should throw error if the file does not exist', async () => {
      try {
        const fileName = 'test/logs/'
        await uut.readLines(fileName)

        assert.fail('Unexpected result')
      } catch (err) {
        assert.include(err.message, 'file does not exist')
      }
    })

    it('should ignore fileReader callback errors', async () => {
      // https://sinonjs.org/releases/latest/stubs/
      // About yields
      sandbox.stub(uut.lineReader, 'eachLine').yieldsRight({}, true)

      const fileName = `${__dirname.toString()}/../mocks/adapters/fake-log`

      const result = await uut.readLines(fileName)
      assert.isArray(result)
    })

    it('should return data', async () => {
      const fileName = `${__dirname.toString()}/../mocks/adapters/fake-log`

      const result = await uut.readLines(fileName)

      assert.isArray(result)
      assert.property(result[1], 'message')
      assert.property(result[1], 'level')
      assert.property(result[1], 'timestamp')
    })
  })
})
