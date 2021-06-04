import React from 'react';
import SwitchButton from './SwitchButton.js';
import TeamRecordsContract from '../build/contracts/TeamRecords.json';
import AdminPanel from './AdminPanel';
import Web3 from 'web3'

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
      contractAddress:null,
      account: null,
      ipfs: null,
      // the list of records
      records: [],
      // the interface tab that is currently open
      activeTab: 0
    };
  }

  componentDidMount() {
    this.changeWeb3Provider("https://rpc.c5v.network")
  }

  changeAccount = (acc) => {
    if (acc.length > 0) {
      this.setState({ account: acc[0] })
      return
    }
    this.setState({ account: null })
  }

  changeWeb3Provider = (provider) => {
    this.setState({ web3: new Web3(provider) }, () => { this.init() })
  }

  init() {
    // Instantiate the contract
    let contractAddress = TeamRecordsContract.networks[CHAIN_ID].address;
    this.setState({ contractAddress: contractAddress })
    const TeamRecords = new this.state.web3.eth.Contract(TeamRecordsContract.abi, contractAddress);
    // Initialize IPFS interface
    const IPFS = require('ipfs-api');
    this.setState({ ipfs: new IPFS({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' })})
      // Save the instance of the contract
     this.setState(
        { contract: TeamRecords },
        () => {
          // Load the list of records from the contract
          this.loadRecords().then(result => {
            // Call other callbacks that might be waiting for the contract to get ready
            if (typeof this.onContractReady === 'function') {
              this.onContractReady();
            }
          }).catch(error => {
            console.log(error);
          });
        }
      );

  }

  setOnContractReady = (callback) => {
    this.onContractReady = () => {
      callback(this.state.web3, this.state.contract);
    }
    if (this.state.web3 !== null && this.state.contract !== null) {
      this.onContractReady();
    }
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

  render() {
    return (
      <div className="App">
        <SwitchButton
          networkId={CHAIN_ID}
          chainParams={CHAIN_PARAMS}
          onChangeAccount={this.changeAccount}
          onChangeProvider={this.changeWeb3Provider}
        />

        <main className="container">
          <AdminPanel
            records={this.state.records}
            setRecords={this.setRecords}
            web3={this.state.web3}
            contract={this.state.contract}
            contractAddress={this.state.contractAddress}
            account={this.state.account}
            ipfs={this.state.ipfs}
            onTransactionConfirmed={this.loadRecords}
          />
        </main>
      </div>
    );
  }
}

export default App;
