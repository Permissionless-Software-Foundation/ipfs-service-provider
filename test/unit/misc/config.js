/*
  Unit tests for the config directory
*/

import { assert } from 'chai'

let currentEnv

describe('#config', () => {
  before(() => {
    // Backup the current environment setting.
    currentEnv = process.env.SVC_ENV
    // Clear SVC_ENV for the first test to ensure default behavior
    delete process.env.SVC_ENV
  })

  after(() => {
    // Restore the environment setting before starting these tests.
    if (currentEnv) {
      process.env.SVC_ENV = currentEnv
    } else {
      delete process.env.SVC_ENV
    }
  })

  it('Should return development environment config by default', async () => {
    // Ensure SVC_ENV is not set for this test
    delete process.env.SVC_ENV
    const importedConfig = await import('../../../config/index.js?foo=bar0')
    const config = importedConfig.default
    // console.log('config: ', config)

    assert.equal(config.env, 'dev')
  })

  it('Should return test environment config', async () => {
    // Hack to dynamically import a library multiple times:
    // https://github.com/denoland/deno/issues/6946

    process.env.SVC_ENV = 'test'

    const importedConfig2 = await import('../../../config/index.js?foo=bar1')
    const config = importedConfig2.default
    // console.log('config: ', config)

    assert.equal(config.env, 'test')
  })

  it('Should return prod environment config', async () => {
    process.env.SVC_ENV = 'prod'

    process.env.WALLET_INTERFACE = 'web2'
    process.env.APISERVER = 'https://api.fullstack.cash/v5/'

    await import('../../../config/env/common.js?foo=bar2')
    const importedConfig3 = await import('../../../config/index.js?foo=bar2')
    const config = importedConfig3.default
    // console.log('config: ', config)

    assert.equal(config.env, 'prod')
  })
})

describe('#config BOOTSTRAP_SERVERS', () => {
  let savedBootstrapServers

  before(() => {
    savedBootstrapServers = process.env.BOOTSTRAP_SERVERS
  })

  afterEach(() => {
    // Restore the original value so other tests are unaffected.
    if (savedBootstrapServers === undefined) {
      delete process.env.BOOTSTRAP_SERVERS
    } else {
      process.env.BOOTSTRAP_SERVERS = savedBootstrapServers
    }
  })

  it('Should be undefined when BOOTSTRAP_SERVERS is unset', async () => {
    delete process.env.BOOTSTRAP_SERVERS

    const importedConfig = await import('../../../config/env/common.js?bootstrap0')
    const config = importedConfig.default

    assert.equal(config.bootstrapPeers, undefined)
  })

  it('Should parse a single bootstrap server', async () => {
    const multiaddr =
      '/ip4/172.18.0.3/tcp/4101/p2p/12D3KooWDDrYph3KNxASGR5a4Bjw8thVTfK6MHiNCSz6GvygXwdR'
    process.env.BOOTSTRAP_SERVERS = multiaddr

    const importedConfig = await import('../../../config/env/common.js?bootstrap1')
    const config = importedConfig.default

    assert.isArray(config.bootstrapPeers)
    assert.equal(config.bootstrapPeers.length, 1)
    assert.equal(config.bootstrapPeers[0], multiaddr)
  })

  it('Should split a comma-delimited list and trim whitespace', async () => {
    const addr1 =
      '/ip4/172.18.0.3/tcp/4101/p2p/12D3KooWDDrYph3KNxASGR5a4Bjw8thVTfK6MHiNCSz6GvygXwdR'
    const addr2 =
      '/ip4/143.198.134.59/tcp/4101/p2p/12D3KooWHogx3RcyNiSuY6SzS8GxzTAqtDCYzy17yQ1StWaLvX9j'
    process.env.BOOTSTRAP_SERVERS = `${addr1}, ${addr2}`

    const importedConfig = await import('../../../config/env/common.js?bootstrap2')
    const config = importedConfig.default

    assert.deepEqual(config.bootstrapPeers, [addr1, addr2])
  })

  it('Should ignore blank entries', async () => {
    const addr1 =
      '/ip4/172.18.0.3/tcp/4101/p2p/12D3KooWDDrYph3KNxASGR5a4Bjw8thVTfK6MHiNCSz6GvygXwdR'
    process.env.BOOTSTRAP_SERVERS = `${addr1},,  ,`

    const importedConfig = await import('../../../config/env/common.js?bootstrap3')
    const config = importedConfig.default

    assert.deepEqual(config.bootstrapPeers, [addr1])
  })

  it('Should be undefined for an empty/whitespace-only value', async () => {
    process.env.BOOTSTRAP_SERVERS = '   '

    const importedConfig = await import('../../../config/env/common.js?bootstrap4')
    const config = importedConfig.default

    assert.equal(config.bootstrapPeers, undefined)
  })

  it('Should throw on a malformed multiaddr', async () => {
    process.env.BOOTSTRAP_SERVERS = '172.18.0.3:4101'

    let threw = false
    try {
      await import('../../../config/env/common.js?bootstrap5')
    } catch (err) {
      threw = true
      assert.include(err.message, 'BOOTSTRAP_SERVERS')
    }

    assert.equal(threw, true)
  })
})
