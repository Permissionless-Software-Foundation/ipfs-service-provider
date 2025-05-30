/*
  Liveness test runs before all other tests to ensure the server is running.
*/

// Public npm libraries
import { assert } from 'chai'
import axios from 'axios'
import testUtils from '../../utils/test-utils.js'

// const sinon = require('sinon')

// Local support libraries
import config from '../../../config/index.js'
// import Server from '../../../bin/server.js'
// import testUtils from '../../utils/test-utils.js'
// const adminLib = new AdminLib()

const LOCALHOST = `http://localhost:${config.port}`

describe('#Check Server Liveness', () => {
  // before(async () => {
  it('should confirm the server is running', async () => {
    try {
      const response = await axios.get(`${LOCALHOST}/`)
      assert(response.status === 200, 'Server is running, continuing with E2E tests.')
    } catch (err) {
      console.log('\nServer is not running, exiting tests.')
      console.log('Start the server with `npm run start:e2e:server` before running E2E tests.\n')
      console.log('Ensure running npm run docs before running the test server')
      process.exit(1)
    }
  })
  it('should confirm the server is running over test enviroment', async () => {
    try {
      const res = await testUtils.loginAdminUser()
      assert.property(res, 'user')
      assert.property(res, 'token')
      assert.property(res, 'id')
    } catch (err) {
      console.log('\nServer is not running over test enviroment, exiting tests.')
      console.log('Start the server with `npm run start:e2e:server` before running E2E tests.\n')
      process.exit(1)
    }
  })
})
