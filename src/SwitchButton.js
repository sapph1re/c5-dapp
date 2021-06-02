import React from 'react';
import './css/switch-button.css';

class SwitchButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentAccounts: ['0x0000000000000000000000000000000000000000'],
      isRightChain:null,
      metamaskInstalled:false
    }
  }

  componentDidMount() {
     if (window.ethereum) {
      this.setState({ metamaskInstalled: true })
      this.isRightChainId()
      const account = window.ethereum.selectedAddress
      if (account && account !== '') {
        this.setState({ currentAccounts: [account] })
      }
      window.ethereum.on('chainChanged', (_chainId) => {
         this.isRightChainId()
      })
       window.ethereum.on('accountsChanged', (accounts) => {
           if (accounts.length === 0) {
               this.setState({ currentAccounts: ['0x0000000000000000000000000000000000000000'] })
           } else {
               this.setState({ currentAccounts: accounts })
           }
      })
    }
  }

  isRightChainId() {
    const chain = parseInt(window.ethereum.chainId)
    // ganache always returns 1337 as chain id, so we need to ignore this check if we are in local developement mode
    this.setState({ isRightChain: chain === 1337 ? true : chain === parseInt(this.props.networkId) })
  }

   switchChain = () => {
    if (window.ethereum) {
       window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [
          this.props.chainParams
        ]
      }).catch((err) => {
        console.log(err)
      })
    }
  }

  connectToWallet= () => {
    if (window.ethereum) {
       window.ethereum.request({ method: 'eth_requestAccounts' })
      .catch((err) => {
        console.log(err)
      })
    }
  }

  render() {
    return(
      <div> {(() => {
        if (!this.state.metamaskInstalled) {
            return <a className="button metamask" onClick={this.switchChain} href="https://metamask.io/download" target="_blank" rel="noopener noreferrer" >Install Metamask</a>
        }
        if (!this.state.isRightChain) {
            return <button className="button" onClick={this.switchChain}>Switch Chain</button>
        }
        if (this.state.currentAccounts === ['0x0000000000000000000000000000000000000000']) {
          return <button className="button" onClick={this.connectToWallet} >Connect to Metamask</button>
        }
        return <div className="button">{ this.state.currentAccounts[0].slice(0, 6) + '...' + this.state.currentAccounts[0].slice(this.state.currentAccounts[0].length - 4, this.state.currentAccounts[0].length)}</div>
      })()}</div>
    )
  }
}

export default SwitchButton;