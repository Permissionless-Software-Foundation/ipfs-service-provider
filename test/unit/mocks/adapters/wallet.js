import BCHJS from "@psf/bch-js";

const mockWallet = {
    mnemonic: 'course abstract aerobic deer try switch turtle diet fence affair butter top',
    privateKey: 'L5D2UAam8tvo3uii5kpgaGyjvVMimdrXu8nWGQSQjuuAix6ji1YQ',
    publicKey: '0379433ffc401483ade310469953c1cba77c71af904f07c15bde330d7198b4d6dc',
    cashAddress: 'bitcoincash:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acv7fqtd00',
    address: 'bitcoincash:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acv7fqtd00',
    slpAddress: 'simpleledger:qzl0d3gcqeypv4cy7gh8rgdszxa9vvm2acq9zm7d33',
    legacyAddress: '1JQj1KcQL7GPKzc1D2PvdUSgw3MbDtrHzi',
    hdPath: "m/44'/245'/0'/0/0",
    nextAddress: 1
};

class MockBchWallet {
    constructor() {
        this.walletInfoPromise = true;
        this.walletInfo = mockWallet;
        this.initialize = async () => {}
        this.bchjs = new BCHJS();
        this.burnTokens = async () => {
            return { success: true, txid: 'txid' };
        };
        this.sendTokens = async () => {
            return 'fakeTxid';
        };
        this.getUtxos = async () => { };
        this.getBalance = async () => { };
        this.listTokens = async () => { };
        this.getTxData = async () => {
            return [{
                    tokenTicker: 'TROUT'
                }];
        };
        this.optimize = async () => { };
        // Environment variable is used by wallet-balance.unit.js to force an error.
        if (process.env.NO_UTXO) {
            this.utxos = {};
        }
        else {
            this.utxos = {
                utxoStore: {
                    address: 'bitcoincash:qqetvdnlt0p8g27dr44cx7h057kpzly9xse9huc97z',
                    bchUtxos: [
                        {
                            height: 700685,
                            tx_hash: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
                            tx_pos: 0,
                            value: 1000,
                            txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
                            vout: 0,
                            isValid: false
                        },
                        {
                            height: 700685,
                            tx_hash: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
                            tx_pos: 2,
                            value: 19406,
                            txid: '1fc577caaff5626a8477162581e57bae1b19dc6aa6c10638013c2b1ba14dc654',
                            vout: 2,
                            isValid: false
                        }
                    ],
                    nullUtxos: [],
                    slpUtxos: {
                        type1: {
                            mintBatons: [],
                            tokens: [
                                {
                                    'height': 717331,
                                    'tx_hash': '74889580bb1a5f8c026aa2f55118ac9917df3332f7abae72a70343daa1c29621',
                                    'tx_pos': 1,
                                    'value': 546,
                                    'txid': '74889580bb1a5f8c026aa2f55118ac9917df3332f7abae72a70343daa1c29621',
                                    'vout': 1,
                                    'isSlp': true,
                                    'type': 'token',
                                    'qty': '10',
                                    'tokenId': '600ee24d0f208aebc2bdd2c4ee1b9acb6d57343561442e8676b5bbea311d5a0f',
                                    'address': 'bitcoincash:qqraj35x6l2qyqhjm5l7qlt7z2245ez8l5z3dwkeq5',
                                    'ticker': 'FLIPS',
                                    'name': 'FLIPS',
                                    'documentUri': '',
                                    'documentHash': '',
                                    'decimals': 1,
                                    'qtyStr': '1'
                                },
                                {
                                    'height': 730597,
                                    'tx_hash': '52520faddfafc46b8f8c9548b097f3a3b82a5bf363b5095047b9c5f83247fe36',
                                    'tx_pos': 1,
                                    'value': 546,
                                    'txid': '52520faddfafc46b8f8c9548b097f3a3b82a5bf363b5095047b9c5f83247fe36',
                                    'vout': 1,
                                    'isSlp': true,
                                    'type': 'token',
                                    'qty': '34999991',
                                    'tokenId': '38e97c5d7d3585a2cbf3f9580c82ca33985f9cb0845d4dcce220cb709f9538b0',
                                    'address': 'bitcoincash:qqraj35x6l2qyqhjm5l7qlt7z2245ez8l5z3dwkeq5',
                                    'ticker': 'PSF',
                                    'name': 'Permissionless Software Foundation',
                                    'documentUri': 'psfoundation.cash',
                                    'documentHash': '',
                                    'decimals': 8,
                                    'qtyStr': '0.34999991'
                                },
                                {
                                    'height': 730597,
                                    'tx_hash': '5dc7e7c91382aed1666a51212dfb74050261e12c3c4f62b6b1e57f42d6c51ee1',
                                    'tx_pos': 2,
                                    'value': 546,
                                    'txid': '5dc7e7c91382aed1666a51212dfb74050261e12c3c4f62b6b1e57f42d6c51ee1',
                                    'vout': 2,
                                    'isSlp': true,
                                    'type': 'token',
                                    'qty': '18898',
                                    'tokenId': 'a4fb5c2da1aa064e25018a43f9165040071d9e984ba190c222a7f59053af84b2',
                                    'address': 'bitcoincash:qqraj35x6l2qyqhjm5l7qlt7z2245ez8l5z3dwkeq5',
                                    'ticker': 'TROUT',
                                    'name': "Trout's test token",
                                    'documentUri': 'troutsblog.com',
                                    'documentHash': '',
                                    'decimals': 2,
                                    'qtyStr': '188.98'
                                }
                            ]
                        },
                        nft: {
                            tokens: []
                        },
                        group: {
                            tokens: [],
                            mintBatons: []
                        }
                    }
                }
            };
        }
    }
}

export { MockBchWallet };

export { mockWallet };

export default {
    MockBchWallet,
    mockWallet
};
