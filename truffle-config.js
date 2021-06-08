const HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  networks: {
    development: {
     host: "127.0.0.1",     // Localhost (default: none)
     port: 8545,            // Standard Ethereum port (default: none)
     network_id: "*",       // Any network (default: none)
    },
    sapph1re: {
      host: "165.22.101.63",
      port: 8545,
      network_id: "*"
    },
    c5v: {
      provider: () => {
        return new HDWalletProvider(
          "thumb image ethics scan laundry elder quick stereo ocean link seat hood",
          "https://rpc.c5v.network"
        )
      },
      gas: 7500000,
      gasPrice: 1000000000,
      network_id: 304
    }
  },

  // Set default mocha options here, use special reporters etc.
  mocha: {
    // timeout: 100000
  },

  // Configure your compilers
  compilers: {
    solc: {
      version: "0.8.0",    // Fetch exact version from solc-bin (default: truffle's version)
      // docker: true,        // Use "0.5.1" you've installed locally with docker (default: false)
      settings: {          // See the solidity docs for advice about optimization and evmVersion
        optimizer: {
          enabled: false,
          runs: 200
        },
      //  evmVersion: "byzantium"
      }
    }
  }
};
