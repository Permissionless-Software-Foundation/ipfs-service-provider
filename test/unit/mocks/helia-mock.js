/*
  Mocking library for helia.
  This is used to replace the helia library when running unit tests.
*/

const ipfs = {
  libp2p: {
    getMultiaddrs: () => [],
    peerId: 'fake-id'
  }
}

export default ipfs
