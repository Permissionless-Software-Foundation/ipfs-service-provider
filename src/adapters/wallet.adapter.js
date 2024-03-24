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
        advancedConfig.restURL = this.config.consumerUrl
      }

      console.log('advancedConfig setting when creating wallet: ', advancedConfig)

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

    console.log('_instanceWallet() wallet.bchjs.restURL: ', wallet.bchjs.restURL)

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
        // console.log('this.config.walletFile: ', this.config.walletFile)
        walletData = await this.jsonFiles.readJSON(this.config.walletFile)
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
        await this.jsonFiles.writeJSON(walletData, this.config.walletFile)
      }

      // console.log('walletData: ', walletData)
      return walletData
    } catch (err) {
      console.error('Error in openWallet()')
      throw err
    }
  }
}

export default Wallet
