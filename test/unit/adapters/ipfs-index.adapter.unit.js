/*
  Unit tests for the index.js file for the IPFS and ipfs-coord libraries.
*/

import { assert } from 'chai'

import sinon from 'sinon'
import IPFSLib from '../../../src/adapters/ipfs/index.js'
// import create from '../mocks/ipfs-mock.js'
import IPFSCoordMock from '../mocks/ipfs-coord-mock.js'

describe('#IPFS-adapter-index', () => {
  let uut
  let sandbox

  beforeEach(() => {
    uut = new IPFSLib()

    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  describe('#start', () => {
    it('should return a promise that resolves into an instance of IPFS.', async () => {
      // Mock dependencies.
      uut.ipfsAdapter = {
        start: async () => {}
      }
      uut.IpfsCoordAdapter = IPFSCoordMock

      const result = await uut.start()

      assert.equal(result, true)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut.ipfsAdapter, 'start').rejects(new Error('test error'))

        await uut.start()

        assert.fail('Unexpected code path.')
      } catch (err) {
        // console.log(err)
        assert.include(err.message, 'test error')
      }
    })

    it('should handle lock-file errors', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut.ipfsAdapter, 'start')
          .rejects(new Error('Lock already being held'))

        // Prevent process from exiting
        sandbox.stub(uut.process, 'exit').returns()

        await uut.start()

        assert.fail('Unexpected code path.')
      } catch (err) {
        assert.include(err.message, 'Lock already being held')
      }
    })
  })

  describe('#getStatus', () => {
    it('should return an object with node metrics', () => {
      // Force uut to have the needed properties
      uut.ipfsCoordAdapter = {
        ipfsCoord: {
          thisNode: {
            ipfsId: 'fake-id',
            ipfsMultiaddrs: [],
            bchAddr: 'fake-bch-addr',
            slpAddr: 'fake-slp-addr',
            pubKey: 'fake-pubkey',
            peerList: [],
            relayData: []
          }
        }
      }

      const result = uut.getStatus()
      // console.log('result: ', result)

      assert.property(result, 'ipfsId')
      assert.property(result, 'multiAddrs')
      assert.property(result, 'bchAddr')
      assert.property(result, 'slpAddr')
      assert.property(result, 'pubKey')
      assert.property(result, 'peers')
      assert.property(result, 'relays')
    })

    it('should catch, report, and throw errors', () => {
      try {
        uut.getStatus()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err.message: ', err.message)
        assert.include(err.message, 'Cannot read properties')
      }
    })
  })

  describe('#_removeDuplicatePeers', () => {
    it('should return the same array when there are no duplicates', () => {
      const inArray = [
        '12D3KooWPpBXhhAeoCZCGuQ3KR4xwHzzvtP57f6zLmo8P7ZFBJFE',
        '12D3KooWRBhwfeP2Y9CDkFRBAZ1pmxUadH36TKuk3KtKm5XXP8mA',
        '12D3KooWGsgHWyDLKuV4ZSfRJfsxQJj77rxx3i8Px3qXKHsLN7a2',
        '12D3KooWJyc54njjeZGbLew4D8u1ghrmZTTPyh3QpBF7dxtd3zGY',
        '12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu'
      ]

      const result = uut._removeDuplicatePeers(inArray)
      // console.log('result: ', result)

      assert.equal(result.length, inArray.length)
    })

    it('should remove duplicates from an array', () => {
      const inArray = [
        '12D3KooWPpBXhhAeoCZCGuQ3KR4xwHzzvtP57f6zLmo8P7ZFBJFE',
        '12D3KooWRBhwfeP2Y9CDkFRBAZ1pmxUadH36TKuk3KtKm5XXP8mA',
        '12D3KooWGsgHWyDLKuV4ZSfRJfsxQJj77rxx3i8Px3qXKHsLN7a2',
        '12D3KooWJyc54njjeZGbLew4D8u1ghrmZTTPyh3QpBF7dxtd3zGY',
        '12D3KooWDtj9cfj1SKuLbDNKvKRKSsGN8qivq9M8CYpLPDpcD5pu',
        '12D3KooWPpBXhhAeoCZCGuQ3KR4xwHzzvtP57f6zLmo8P7ZFBJFE',
        '12D3KooWRBhwfeP2Y9CDkFRBAZ1pmxUadH36TKuk3KtKm5XXP8mA'
      ]

      const result = uut._removeDuplicatePeers(inArray)
      // console.log('result: ', result)

      assert.equal(result.length, inArray.length - 2)
    })
  })
})
