/*
  Wallet adapter. This library instantiates minimal-slp-wallet based on different
  configuration settings. That single instance of minimal-slp-wallet is then
  easily passed around the rest of this application.
*/

// Global npm libraries
import BchWallet from 'minimal-slp-wallet'

// Local libraries
import config from '../../config/index.js'
import JsonFiles from './json-files.js'

class Wallet {
  constructor (localConfig = {}) {
    // Encapsulate dependencies
    this.config = config
    this.BchWallet = BchWallet
    this.jsonFiles = new JsonFiles()

    // Bind 'this' object to all subfunctions
    this.instanceWalletWithoutInitialization = this.instanceWalletWithoutInitialization.bind(this)
    this._instanceWallet = this._instanceWallet.bind(this)
    this.openWallet = this.openWallet.bind(this)
    this.instanceWallet = this.instanceWallet.bind(this)
    this.incrementNextAddress = this.incrementNextAddress.bind(this)
    this.getKeyPair = this.getKeyPair.bind(this)
    this.optimize = this.optimize.bind(this)
    this.getBalance = this.getBalance.bind(this)
  }

  // This is used for initializing the wallet, without waiting to update the wallet
  // UTXOs from the blockchain.
  // This is useful when the wallet is simply needed to make calls to the blockchain,
  // and there is no need to hydrate it with UTXO data.
  async instanceWalletWithoutInitialization (walletData = {}, advancedConfig = {}) {
    try {
      // Use the apiToken from the config settings, if one is not passed-in at
      // run-time.
      if (!advancedConfig.apiToken) {
        advancedConfig.apiToken = this.config.apiToken
      }

      // If an authentication password is passed in the config, add it.
      if (this.config.authPass) {
        advancedConfig.authPass = this.config.authPass
      }

      // Detect and configure different blockchain infrastructure settings.
      if (this.config.walletInterface === 'web2') {
        advancedConfig.interface = 'rest-api'
        advancedConfig.restURL = this.config.apiServer
      } else {
        // By default use the web3 Cash Stack (https://cashstack.info)
        advancedConfig.interface = 'consumer-api'
        advancedConfig.restURL = this.config.apiServer
      }

      // console.log('advancedConfig setting when creating wallet: ', advancedConfig)

      // Instantiate minimal-slp-wallet.
      if (walletData.mnemonic) {
        // Instance the wallet using the mnemonic passed in to this function.
        console.log('Mnemonic provided to wallet library from calling function.')
        this.bchWallet = await this._instanceWallet(walletData.mnemonic, advancedConfig)
      } else if (this.config.mnemonic) {
        // Otherwise use the mnemonic in the config setting or passed as an environment variable.
        console.log('Mnemonic retrieved from config file or environment variable.')
        this.bchWallet = await this._instanceWallet(this.config.mnemonic, advancedConfig)
      } else {
        // If no mnemonic is provided, then generate a new mnemonic to create the wallet.
        console.log('New mnemonic generated.')
        this.bchWallet = await this._instanceWallet(undefined, advancedConfig)
      }

      // Wait for wallet to initialize.
      await this.bchWallet.walletInfoPromise
      console.log('BCH wallet initialized.')
      console.log(`Wallet address: ${this.bchWallet.walletInfo.cashAddress}`)
      console.log(`Wallet mnemonic: ${this.bchWallet.walletInfo.mnemonic}`)

      return this.bchWallet
    } catch (err) {
      console.error('Error in instanceWalletWithoutInitialization()')
      throw err
    }
  }

  // This function is used for easier mocking of unit tests.
  async _instanceWallet (mnemonic, config) {
    const wallet = new this.BchWallet(mnemonic, config)
    await wallet.walletInfoPromise

    return wallet
  }

  // Open the wallet file, or create one if the file doesn't exist.
  // Does not instance the wallet. The output of this function is expected to
  // be passed to instanceWallet().
  async openWallet (advancedConfig = {}) {
    try {
      let walletData

      // Try to open the wallet.json file.
      try {
        walletData = await this.jsonFiles.readJSON(this.config.walletFile)
        walletData = walletData.wallet
      } catch (err) {
        // Create a new wallet file if one does not already exist.
        console.log('Wallet file not found. Creating new wallet.json file.')

        // Create a new wallet.
        // No-Update flag creates wallet without making any network calls.
        const walletInstance = await this.instanceWalletWithoutInitialization({}, advancedConfig)

        walletData = walletInstance.walletInfo

        // Add the nextAddress property
        walletData.nextAddress = 1

        // Write the wallet data to the JSON file.
        await this.jsonFiles.writeJSON({ wallet: walletData }, this.config.walletFile)
      }

      // console.log('walletData: ', walletData)
      return walletData
    } catch (err) {
      console.error('Error in openWallet()')
      throw err
    }
  }

  // Create an instance of minimal-slp-wallet. Same as
  // instanceWalletWithoutInitialization(), but waits for the wallet to initialize
  // its UTXOs (wallet balance and tokens).
  async instanceWallet (walletData = {}, advancedConfig = {}) {
    try {
      // Instance the wallet without initialization.
      await this.instanceWalletWithoutInitialization(walletData, advancedConfig)

      // Initialize the wallet
      await this.bchWallet.initialize()

      return this.bchWallet
    } catch (err) {
      console.error('Error in wallet.js/instanceWallet()')
      throw err
    }
  }

  // Increments the 'nextAddress' property in the wallet file. This property
  // indicates the HD index that should be used to generate a key pair for
  // storing funds for Offers.
  // This function opens the wallet file, increments the nextAddress property,
  // then saves the change to the wallet file.
  async incrementNextAddress () {
    try {
      const walletData = await this.openWallet()

      await this.instanceWalletWithoutInitialization(walletData)

      walletData.nextAddress++
      // console.log('walletData finish: ', walletData)

      await this.jsonFiles.writeJSON({ wallet: walletData }, this.config.walletFile)

      // Update the working instance of the wallet.
      this.bchWallet.walletInfo.nextAddress++
      // console.log('this.bchWallet.walletInfo: ', this.bchWallet.walletInfo)

      return walletData.nextAddress
    } catch (err) {
      console.error('Error in incrementNextAddress()')
      throw err
    }
  }

  // This method returns an object that contains a private key WIF, public address,
  // and the index of the HD wallet that the key pair was generated from.
  // TODO: Allow input integer. If input is used, use that as the index. If no
  // input is provided, then call incrementNextAddress().
  async getKeyPair (hdIndex = 0) {
    try {
      if (!hdIndex) {
        // Increment the HD index and generate a new key pair.
        hdIndex = await this.incrementNextAddress()
      }

      const mnemonic = this.bchWallet.walletInfo.mnemonic

      // root seed buffer
      const rootSeed = await this.bchWallet.bchjs.Mnemonic.toSeed(mnemonic)
      const masterHDNode = this.bchWallet.bchjs.HDNode.fromSeed(rootSeed)

      // HDNode of BIP44 account
      // const account = this.bchWallet.bchjs.HDNode.derivePath(masterHDNode, "m/44'/245'/0'")
      const childNode = masterHDNode.derivePath(`m/44'/245'/0'/0/${hdIndex}`)
      const cashAddress = this.bchWallet.bchjs.HDNode.toCashAddress(childNode)
      console.log('Generating a new key pair for cashAddress: ', cashAddress)

      const wif = this.bchWallet.bchjs.HDNode.toWIF(childNode)

      const outObj = {
        cashAddress,
        wif,
        hdIndex
      }
      return outObj
    } catch (err) {
      console.error('Error in getKeyPair()')
      throw err
    }
  }

  // Optimize the wallet by consolidating the UTXOs.
  async optimize () {
    const UTXO_THREASHOLD = 7
    // Do a dry-run first to see if there are enough UTXOs worth consolidating.
    const dryRunOut = await this.bchWallet.optimize(true)
    if (dryRunOut.bchUtxoCnt > UTXO_THREASHOLD) {
      // Consolidate BCH UTXOs if the count is above the threashold.
      const txids = await this.bchWallet.optimize()
      console.log(`Wallet optimized with these return values: ${JSON.stringify(txids, null, 2)}`)
    }
    return true
  }

  // Get the balance of the wallet in sats and PSF tokens.
  // This function is called by the GET /entry/balance controller.
  async getBalance () {
    const balance = await this.bchWallet.getBalance()
    // console.log('balance: ', balance)
    const tokens = await this.bchWallet.listTokens()
    // console.log('tokens: ', tokens)
    // Find the array entry for the PSF token
    const psfTokens = tokens.find(x => x.tokenId === '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0')
    // console.log('psfTokens: ', psfTokens)
    let psfBalance = 0
    if (psfTokens) {
      psfBalance = psfTokens.qty
    }
    const outObj = {
      satBalance: balance,
      psfBalance,
      success: true
    }
    return outObj
  }
}

export default Wallet
