/*
End-to-end tests for /usage endpoints.
*/

import config from '../../../config/index.js'
import { assert } from 'chai'
import axios from 'axios'
import sinon from 'sinon'
import util from 'util'

util.inspect.defaultOptions = { depth: 1 }

const LOCALHOST = `http://localhost:${config.port}`

let sandbox

describe('Usage', () => {
  beforeEach(() => {
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('GET /usage', () => {
    it('should return usage status', async () => {
      try {
        const options = {
          method: 'get',
          url: `${LOCALHOST}/usage`
        }

        const result = await axios(options)

        assert.property(result.data, 'status')
      } catch (err) {
        assert(false, 'Unexpected result')
      }
    })
  })

  describe('GET /usage/ips', () => {
    it('should return ips', async () => {
      try {
        const options = {
          method: 'get',
          url: `${LOCALHOST}/usage/ips`
        }

        const result = await axios(options)

        assert.property(result.data, 'ips')
      } catch (err) {
        assert(false, 'Unexpected result')
      }
    })
  })

  describe('GET /usage/endpoints', () => {
    it('should return ips', async () => {
      try {
        const options = {
          method: 'get',
          url: `${LOCALHOST}/usage/endpoints`
        }

        const result = await axios(options)

        assert.property(result.data, 'endpoints')
      } catch (err) {
        assert(false, 'Unexpected result')
      }
    })
  })
})
