import React from 'react';
import getWeb3 from './utils/getWeb3';
import SwitchButton from './SwitchButton.js';
import TeamRecordsContract from '../build/contracts/TeamRecords.json';
import AdminPanel from './AdminPanel';

import './css/oswald.css'
import './App.css'


const GPSmult = 100000000;

const CHAIN_ID = "304"

const fileTypes = ['Photo', 'Text', 'Audio', 'Video'] //enums are cast as numbers in solidity, so I get the index of the item in the array

const CHAIN_PARAMS = {
  chainId: '0x'+parseInt(CHAIN_ID).toString(16),
  chainName: 'C5V Network',
  nativeCurrency: {
    name: 'C5V',
    symbol: 'C5V',
    decimals: 18
  },
  rpcUrls:['https://rpc.c5v.network'],
  blockExplorerUrls: null
}


class App extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      // to save instances of web3, of the smart contract and the current account
      web3: null,
      contract: null,
      account: null,
      ipfs: null,
      // the list of records
      records: [],
      // the interface tab that is currently open
      activeTab: 0
    };
  }

  componentDidMount() {
    // Get network provider and web3 instance.
    // See utils/getWeb3 for more info.

    getWeb3
      .then(results => {
        let web3 = results.web3;
        this.setState({ web3: web3 });
        web3.eth.net.getNetworkType().then(networkType => {
          this.setState({ networkType: networkType });
        });
        web3.eth.net.getId().then(networkId => {
          this.setState(
            { networkId: networkId },
            () => { this.init(); }
          );
        });
      }).catch(e => {
        console.log('Error getting web3: ', e)
      });
  }

  checkChainChange(){
    const ethereum = window.ethereum;
    if (ethereum) {
      ethereum.on('chainChanged', chainId => {
        this.setState({ networkId: chainId })
      })
    }
  }

  init() {
    // Instantiate the contract
    console.log('Network ID: ', this.state.networkId);
    let contractAddress = TeamRecordsContract.networks[CHAIN_ID].address;
    const TeamRecords = new this.state.web3.eth.Contract(TeamRecordsContract.abi, contractAddress);
    // Initialize IPFS interface
    const IPFS = require('ipfs-api');
    const ipfs = new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });
    this.setState({ ipfs: ipfs });

    // Get accounts.
    this.state.web3.eth.getAccounts((error, accounts) => {
      if (error) {
        console.log('Failed to get accounts. Error: ', error);
        return;
      }
      // Save the current account
      this.setState({ account: accounts[0] });
      // Detect when account changes
      setInterval(() => {
        this.state.web3.eth.getAccounts((error, accounts) => {
          if (accounts[0] !== this.state.account) {
            // Update account in the state, update the user rights
            this.setState({
              account: accounts[0]
            }, () => {
              this.setUserRights();
            });
          }
        });
      }, 500);

      // Save the instance of the contract
     this.setState(
        { contract: TeamRecords },
        () => {
          // Load the list of records from the contract
          this.loadRecords().then(result => {
            // Set the user rights depending on their account
            return this.setUserRights();
          }).then(result => {
            // Update the list every time a record is added
            let updateRecordsCallback = (error, result) => {
              if (error) {
                console.log(error);
                return;
              }
              // Update the list of records and update the rights of the user
              this.loadRecords().then(this.setUserRights);
            }
            this.state.contract.events.LogRecordAdded({}, updateRecordsCallback);

            // Call other callbacks that might be waiting for the contract to get ready
            if (typeof this.onContractReady === 'function') {
              this.onContractReady();
            }
          }).catch(error => {
            console.log(error);
          });
        }
      );
    });
  }

  setOnContractReady = (callback) => {
    this.onContractReady = () => {
      callback(this.state.web3, this.state.contract);
    }
    if (this.state.web3 !== null && this.state.contract !== null) {
      this.onContractReady();
    }
  };

  /** Figure out the rights of the user and save it to the state */
  setUserRights = () => {
    // Get the owner of the contract
    // return this.state.contract.methods.owner().call().then(owner => {
    //   // Contract owner is admin
    //   return this.setState({ userIsAdmin: (this.state.account === owner) });
    // });
  };

  /** Get the list of records from the contract and save it to the state */
  loadRecords = () => {
    // First we get the total number of records
    return this.state.contract.methods.getRecordsCount().call().then(recordsCount => {
      // Then we iterate over the array of records to load each of them
      let promises = [];
      for (let i = 0; i < recordsCount; i++) {
        promises.push(
          this.state.contract.methods.records(i).call()
        );
      }
      return Promise.all(promises);
    }).then(results => {
      // Now as we have all records loaded, we save them to the state
      let records = [];
      results.forEach(row => {
        records.push({
          rTime: row[0].toString(),
          rFile: { hash: row[1].IPFS, type: fileTypes[row[1].fileType]},
          rLat: (row[2]/GPSmult).toFixed(8),
          rLon: (row[3]/GPSmult).toFixed(8),
          inProgress: false
        });
      });
      records.sort((a, b) => (parseInt(a.rTime, 10) < parseInt(b.rTime, 10) ? -1 : 1));
      return this.setState({ records: records });
    }).catch(error => {
      console.log(error);
    });
  };

  setRecords = (records) => {
    return this.setState({ records: records });
  };

  switchTab = (event, value) => {
    this.setState({ activeTab: value });
  };

  renderMessage = (message) => (
    <div className="App" style={{ textAlign: 'center', marginTop: 100 }}>
      {message}
    </div>
  );

  render() {
  //  if (!this.state.web3) {
  //     return this.renderMessage('Waiting for web3...');
  //   }
    this.checkChainChange();
    // if (!this.state.account) {
    //   return this.renderMessage('Getting user account... Make sure you are logged in with MetaMask.');
    // }
   // if (!this.state.contract) {
     // return this.renderMessage('Connecting to the contracts...');
   // }
    return (
      <div className="App">
        <SwitchButton
          networkId={CHAIN_ID}
          chainParams={CHAIN_PARAMS}
        />

        <main className="container">
          <AdminPanel
            records={this.state.records}
            setRecords={this.setRecords}
            web3={this.state.web3}
            contract={this.state.contract}
            account={this.state.account}
            ipfs={this.state.ipfs}
          />
        </main>
      </div>
    );
  }
}

export default App;
