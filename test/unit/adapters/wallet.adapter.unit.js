/*
  Unit tests for the Wallet Adapter library.
*/

// Global npm libraries
import { assert } from 'chai'
import sinon from 'sinon'
import BchWallet from 'minimal-slp-wallet'
import fs from 'fs'

// Local libraries
import WalletAdapter from '../../../src/adapters/wallet.adapter.js'
import { MockBchWallet } from '../mocks/adapters/wallet.js'

// Hack to get __dirname back.
// https://blog.logrocket.com/alternatives-dirname-node-js-es-modules/
import * as url from 'url'
const __dirname = url.fileURLToPath(new URL('.', import.meta.url))

// Global constants
const testWalletFile = `${__dirname.toString()}test-wallet.json`

describe('#wallet', () => {
  let uut
  let sandbox

  before(() => {
    // Delete the test file if it exists.
    try {
      deleteFile(testWalletFile)
    } catch (err) { }
  })

  beforeEach(() => {
    uut = new WalletAdapter()
    sandbox = sinon.createSandbox()
  })

  afterEach(() => sandbox.restore())

  after(() => {
    // Delete the test file if it exists.
    try {
      deleteFile(testWalletFile)
    } catch (err) { }
  })

  describe('#_instanceWallet', () => {
    it('should create a wallet given a mnemonic', async () => {
      const mnemonic = 'wagon tray learn flat erase laugh lonely rug check captain jacket morning'
      const result = await uut._instanceWallet(mnemonic)
      // console.log('result: ', result)
      assert.equal(result.walletInfo.mnemonic, mnemonic)
    })
  })

  describe('#openWallet', () => {
    it('should create a new wallet when wallet file does not exist', async () => {
      // Mock dependencies
      uut.BchWallet = MockBchWallet
      // Ensure we open the test file, not the production wallet file.
      uut.config.walletFile = testWalletFile
      const result = await uut.openWallet()
      // console.log('result: ', result)
      assert.property(result, 'mnemonic')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'address')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
      assert.property(result, 'hdPath')
    })

    it('should open existing wallet file', async () => {
      // This test case uses the file created in the previous test case.
      // Ensure we open the test file, not the production wallet file.
      uut.config.walletFile = testWalletFile
      const result = await uut.openWallet()
      // console.log('result: ', result)
      assert.property(result, 'mnemonic')
      assert.property(result, 'privateKey')
      assert.property(result, 'publicKey')
      assert.property(result, 'cashAddress')
      assert.property(result, 'address')
      assert.property(result, 'slpAddress')
      assert.property(result, 'legacyAddress')
      assert.property(result, 'hdPath')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        uut.config.walletFile = ''
        uut.BchWallet = () => {
        }
        await uut.openWallet()
        // console.log('result: ', result)
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'this.BchWallet is not a constructor')
      }
    })
  })

  describe('#instanceWalletWithoutInitialization', () => {
    it('should create an instance of BchWallet', async () => {
      // Create a mock wallet.
      const mockWallet = new BchWallet()
      await mockWallet.walletInfoPromise
      sandbox.stub(mockWallet, 'initialize').resolves()

      // Mock dependencies
      sandbox.stub(uut, '_instanceWallet').resolves(mockWallet)
      uut.config.authPass = 'fake-auth-pass'

      // Ensure we open the test file, not the production wallet file.
      uut.config.walletFile = testWalletFile
      const walletData = await uut.openWallet()

      // console.log('walletData: ', walletData)
      const result = await uut.instanceWalletWithoutInitialization(walletData)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
      assert.property(result, 'walletInfo')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, '_instanceWallet').rejects(new Error('test error'))

        await uut.instanceWalletWithoutInitialization()

        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })

    it('should create an instance of BchWallet using web2 infra', async () => {
      // Create a mock wallet.
      const mockWallet = new BchWallet()
      await mockWallet.walletInfoPromise
      sandbox.stub(mockWallet, 'initialize').resolves()

      // Mock dependencies
      sandbox.stub(uut, '_instanceWallet').resolves(mockWallet)

      // Ensure we open the test file, not the production wallet file.
      uut.config.walletFile = testWalletFile
      const walletData = await uut.openWallet()
      // console.log('walletData: ', walletData)

      // Force desired code path
      uut.config.walletInterface = 'web2'
      const result = await uut.instanceWalletWithoutInitialization(walletData)

      // console.log('result: ', result)
      assert.property(result, 'walletInfoPromise')
      assert.property(result, 'walletInfo')
    })

    it('should generate wallet from mnemonic in config', async () => {
      // Create a mock wallet.
      const mockWallet = new BchWallet()
      await mockWallet.walletInfoPromise
      sandbox.stub(mockWallet, 'initialize').resolves()

      // Mock dependencies
      sandbox.stub(uut, '_instanceWallet').resolves(mockWallet)

      // Ensure we open the test file, not the production wallet file.
      uut.config.walletFile = testWalletFile
      const walletData = await uut.openWallet()
      // console.log('walletData: ', walletData)

      const originalConfig = uut.config.mnemonic
      uut.config.mnemonic = walletData.mnemonic

      const result = await uut.instanceWalletWithoutInitialization({})
      // console.log('result: ', result)

      uut.config.mnemonic = originalConfig

      assert.property(result, 'walletInfoPromise')
      assert.property(result, 'walletInfo')
    })
  })

  describe('#instanceWallet', () => {
    it('should create an instance of BchWallet', async () => {
      // Create a mock wallet.
      const mockWallet = new BchWallet()
      await mockWallet.walletInfoPromise
      sandbox.stub(mockWallet, 'initialize').resolves()

      // Mock dependencies
      sandbox.stub(uut, '_instanceWallet').resolves(mockWallet)

      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile
      const walletData = await uut.openWallet()
      // console.log('walletData: ', walletData)
      const result = await uut.instanceWallet(walletData)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
      assert.property(result, 'walletInfo')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'instanceWalletWithoutInitialization').rejects(new Error('test error'))

        await uut.instanceWallet()
        assert.fail('Unexpected code path')
      } catch (err) {
        // console.log('err: ', err)
        assert.include(err.message, 'test error')
      }
    })

    it('should create an instance of BchWallet using web2 infra', async () => {
      // Create a mock wallet.
      const mockWallet = new BchWallet()
      await mockWallet.walletInfoPromise
      sandbox.stub(mockWallet, 'initialize').resolves()

      // Mock dependencies
      sandbox.stub(uut, '_instanceWallet').resolves(mockWallet)

      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile
      const walletData = await uut.openWallet()
      // console.log('walletData: ', walletData)

      // Force desired code path
      uut.config.useFullStackCash = true
      const result = await uut.instanceWallet(walletData)
      // console.log('result: ', result)

      assert.property(result, 'walletInfoPromise')
      assert.property(result, 'walletInfo')
    })
  })

  describe('#incrementNextAddress', () => {
    it('should increment the nextAddress property', async () => {
      // Ensure we open the test file, not the production wallet file.
      uut.WALLET_FILE = testWalletFile
      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()
      const result = await uut.incrementNextAddress()
      assert.equal(result, 2)
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox.stub(uut, 'openWallet').rejects(new Error('test error'))
        await uut.incrementNextAddress()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#getKeyPair', () => {
    it('should return an object with a key pair', async () => {
      // Ensure we open the test file, not the production wallet file.
      // uut.WALLET_FILE = testWalletFile
      uut.config.walletFile = testWalletFile

      const result = await uut.getKeyPair()
      // console.log('result: ', result)

      assert.property(result, 'cashAddress')
      assert.property(result, 'wif')
      assert.property(result, 'hdIndex')
    })

    it('should catch and throw an error', async () => {
      try {
        // Force an error
        sandbox
          .stub(uut, 'incrementNextAddress')
          .rejects(new Error('test error'))
        await uut.getKeyPair()
        assert.fail('Unexpected code path')
      } catch (err) {
        assert.include(err.message, 'test error')
      }
    })
  })

  describe('#optimize', () => {
    it('should call the wallet optimize function', async () => {
      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()
      sandbox.stub(uut.bchWallet, 'optimize').resolves({ bchUtxoCnt: 10 })
      const result = await uut.optimize()
      assert.equal(result, true)
    })
  })

  describe('#getBalance', () => {
    it('should get the balance for the wallet', async () => {
      // mock instance of minimal-slp-wallet
      uut.bchWallet = new MockBchWallet()
      // Mock dependencies and force desired code path
      sandbox.stub(uut.bchWallet, 'getBalance').resolves(41012)
      sandbox.stub(uut.bchWallet, 'listTokens').resolves([{
        tokenId: '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
        ticker: 'PSF',
        name: 'Permissionless Software Foundation',
        decimals: 8,
        tokenType: 1,
        url: 'psfoundation.cash',
        qty: 2
      }])
      const result = await uut.getBalance()
      // console.log('result: ', result)
      // Assert the expected properties exist and have the expected values.
      assert.equal(result.satBalance, 41012)
      assert.equal(result.psfBalance, 2)
      assert.equal(result.success, true)
    })
  })
})

const deleteFile = (filepath) => {
  try {
    // Delete state if exist
    fs.unlinkSync(filepath)
  } catch (err) {
    // console.error('Error trying to delete file: ', err)
  }
}
