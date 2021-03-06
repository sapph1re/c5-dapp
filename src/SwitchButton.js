import React from 'react';
import './css/switch-button.css';
import WalletConnectProvider from "@walletconnect/web3-provider";
import Web3 from 'web3'

class SwitchButton extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      currentAccounts: [],
      isRightChain: true,
      wrongChain:false,
      ethereum:null
    }
  }

  componentDidMount() {
    const init = () => {
      const getProviderInfo = () => {
            this.isRightChainId()
            const account = window.ethereum.selectedAddress
            if (account && account !== '') {
              this.props.onChangeAccount([account])
              this.setState({ currentAccounts: [account] })
            }
        }
        if (!window.ethereum.isConnected()) {
          window.ethereum.on('connect', () => {
            window.requestAnimationFrame(() => { getProviderInfo() })
          })
        } else {
          getProviderInfo()
        }
        window.ethereum.on('chainChanged', (_chainId) => {
          this.isRightChainId()
        })
        window.ethereum.on('accountsChanged', (accounts) => {
          this.props.onChangeAccount(accounts)
          this.setState({ currentAccounts: accounts })
        })
      }
    if (window.ethereum) {
        this.setState({ethereum:window.ethereum})
        init()
        return
    }
    //no metamask detected, switch to Walletconnect
    this.setState({ walletConnect: true })
  }

  isRightChainId() {
    const chain = parseInt(window.ethereum.chainId)
    // ganache always returns 1337 as chain id, so we need to ignore this check if we are in local developement mode
    this.setState({ isRightChain: chain === 1337 ? true : chain === parseInt(this.props.networkId) })
    this.props.onChangeNetwork(this.state.isRightChain)
  }

   switchChain = () => {
      this.state.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [this.props.chainParams]
      }).catch((err) => {
      console.log(err)
    })
  }

  connectToWallet = () => {
    this.state.ethereum.request({ method: 'eth_requestAccounts' })
    .catch((err) => {
      console.log(err)
    })
  }
   
  connectToWalletconnect = async () => {
    var provider = new WalletConnectProvider({
      rpc: {
        304: this.props.chainParams.rpcUrls[0],
      }
    })

    await provider.enable()

    this.setState({ ethereum: provider })
    this.props.onChangeProvider(provider)

    provider.on("accountsChanged", (accounts) => {
      this.props.onChangeAccount(accounts)
       this.setState({ currentAccounts: accounts })
    })

    provider.on("chainChanged", (chainId) => {
      this.setState({ isRightChain: chainId === parseInt(this.props.networkId) })
      this.props.onChangeNetwork(this.state.isRightChain)
    })

    provider.on("disconnect", () => {
      this.props.onChangeAccount([])
      this.setState({ currentAccounts: [] })
    })

    const web3 = new Web3(provider)
    const chainId = await web3.eth.getChainId()
    const accounts = await web3.eth.getAccounts()

    if (parseInt(chainId) !== parseInt(this.props.networkId)) {
      await provider.disconnect()
      provider = null
      this.setState({ ethereum: null })
      this.setState({ isRightChain: false })
      this.props.onChangeNetwork(false)
      return
    }

    this.setState({ isRightChain: true })
    this.props.onChangeNetwork(true)
    if (accounts.length === 0) {
      this.connectToWallet()
      return
    }
    this.props.onChangeAccount(accounts)
    this.setState({ currentAccounts: accounts })
  }

  disconnectWalletConnect = () => {
      if (this.state.ethereum) {
        this.state.ethereum.disconnect()
        this.setState({ ethereum: null })
      }
  }

  render() {
    return(
      <div> {(() => {

        if (!this.state.isRightChain && this.state.walletConnect) {
            return <div className="button">Wrong Network!</div>
        }
        if (this.state.walletConnect && this.state.currentAccounts.length===0) {
            return <button className="button" onClick={this.state.ethereum ? this.connectToWallet : this.connectToWalletconnect} >Connect</button>
        }
        if (!this.state.walletConnect && this.state.currentAccounts.length===0) {
          return <button className="button" onClick={this.connectToWallet} >Connect to Metamask</button>
        }
        if (!this.state.isRightChain) {
          return <button className="button" onClick={this.switchChain}>Switch Chain</button>
        }
        if (this.state.walletConnect) {
            return <button className="button" onClick={this.disconnectWalletConnect}>{ this.state.currentAccounts[0].slice(0, 6) + '...' + this.state.currentAccounts[0].slice(this.state.currentAccounts[0].length - 4, this.state.currentAccounts[0].length)}</button>
        }
        return <div className="button">{ this.state.currentAccounts[0].slice(0, 6) + '...' + this.state.currentAccounts[0].slice(this.state.currentAccounts[0].length - 4, this.state.currentAccounts[0].length)}</div>
      })()}</div>
    )
  }
}

export default SwitchButton;