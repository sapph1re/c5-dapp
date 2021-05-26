import React, {Component} from 'react'
import PropTypes from 'prop-types';
import {ethers} from 'ethers';
import { MetaMaskButton,  Button, Loader } from 'rimble-ui';
import './css/switch-button.css';




const ModalBackground = ({modalBackgroundStyle}) =>{
  return(
  <div style = {modalBackgroundStyle}>

  </div>
  )
}
const Modal = ( {modalStyle}
) => {
  
  return (
    <div style= {modalStyle}>
    </div>
  );
};

class ConnectionBanner extends Component {
  
  static propTypes = {
    chainParams: PropTypes.object,
    currentNetwork: PropTypes.number,
    mainButtonStyle: PropTypes.object,
    modalBackgroundStyle: PropTypes.object,
    modalStyle: PropTypes.object,
    buttonModalStyle:PropTypes.object,
    loadingModalStyle:PropTypes.object,
    errorModalStyle: PropTypes.object,
    color: PropTypes.string,
    iconStyle: PropTypes.object,
    requiredNetwork: PropTypes.number,
    
  };
  static defaultProps = {
    currentNetwork: null,
    requiredNetwork: null,
    mainButtonStyle: null,
    modalBackgroundlStyle: null,
    modalStyle: null
  };

  
  state = {
    isCorrectNetwork: null,
    isModal: null,
    isMetaMaskConnected: false,
    isLoading: false,
    isSetup: false,
    isMetaMaskInstalled: false,
    currentAccount: '',
    isWalletConnectionError:false,
    isNetworkConnectionError: false,
  };

  


  checkCorrectNetwork = () => {
    const isCorrectNetwork =
      this.props.currentNetwork === this.props.requiredNetwork;
    if (isCorrectNetwork !== this.state.isCorrectNetwork) {
      this.setState({ isCorrectNetwork }, function(){
      });
    }
    
    
    
  };

  async componentDidMount() {
    await this.isMetamaskConnected()
    this.setState({
      isSetup: true
      
    });
    
  }

  requestAccounts = async() =>
  {
    this.setState({isLoading: true}, function () {
      //console.log(this.state.isLoading);
    });
    try
    {
    if(!this.state.isMetaMaskConnected)
    {
      let accs = await window.ethereum.request({ method: 'eth_requestAccounts' });

      this.setState({currentAccount: accs[0].toString()})
    }
    
    this.setState({
      isLoading: false
    });
    this.setState({isLoading: false}, function () {
      //console.log(this.state.isLoading);
    });
    this.setState({isWalletConnectionError: false}, function () {
    })
    this.closeModal()
    this.isMetamaskConnected()
    }catch(err){
      this.setState({isWalletConnectionError: true}, function () {
      })
      this.setState({isLoading: false}, function () {
        //console.log(this.state.isLoading);
      });
    }
    
  }


  switchNetwork = async() =>
  {

    
    this.setState({isLoading: true}, function () {
      //console.log(this.state.isLoading);
    });
    try{
      const res = await window.ethereum.request({ 
          method: 'wallet_addEthereumChain',
          params: [
              this.props.chainParams
            ]
      });
      this.checkCorrectNetwork()
      this.setState({isLoading: false}, function () {
        //console.log(this.state.isLoading);
      });
      this.setState({isNetworkConnectionError: false}, function () {
      })
    }catch(err){
      this.setState({isNetworkConnectionError: true}, function () {
      })
      this.setState({isLoading: false}, function () {
        //console.log(this.state.isLoading);
      });
    }
    
  }


  checkAccountChange(){
    const ethereum = window.ethereum
    if (ethereum) {
      ethereum.on('accountsChanged', accounts => {
        this.isMetamaskConnected()
        this.setState({isWalletConnectionError: false})
      })
    }
  }

  isMetamaskConnected = async() =>
  {
    let provider
    const { ethereum } = window;
    if (ethereum) {
        provider = new ethers.providers.Web3Provider(ethereum);
        this.setState({isMetaMaskInstalled: true})
        const isMetaMaskConnected = async () => {
          let accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            let acc = accounts[0].toString()
            this.setState({currentAccount: acc.slice(0, 6) + '...' + acc.slice(acc.length - 4, acc.length)})
          }
          return accounts.length > 0;
      }
      
      await isMetaMaskConnected().then((connected) => {
          if (connected) {
            this.setState({
              isMetaMaskConnected: true,
              
            });
          } else {
            
            this.setState({
              isMetaMaskConnected: false,
              
            });
            
          }
      });
    }
    else{
      this.setState({isMetaMaskInstalled: false})
    }
    
    
  }
  
  async componentDidUpdate() {
    if (this.props.currentNetwork && this.props.requiredNetwork) {
      this.checkCorrectNetwork();
    }
    
  }

  openModal = () => {
    
    this.setState({
      isModal: true
    });
  };

  closeModal = () => {
    
    this.setState({
      isModal: false
    });
    this.setState({isWalletConnectionError: false})
    this.setState({isNetworkConnectionError: false})
  };

  getRequiredNetwork = () => {

    if(this.state.isCorrectNetwork !== null)
    {
      return this.props.chainParams.chainName
    }
  }
   
  checkChainChange(){
    const ethereum = window.ethereum
    if (ethereum) {
      ethereum.on('chainChanged', chainId => {
        this.setState({isNetworkConnectionError: false })
      })
    }
  }

  

  render() {
    this.checkAccountChange()
    this.checkChainChange()
    let button
    if(!this.state.isSetup)
    {
      button = null
    }
    else if(this.state.isModal)
    {
      
      if(this.state.isLoading)
      {
        button = <div>
          <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>
          
        </div>
        
        <Modal 
        modalStyle = {this.props.modalStyle}>    
        </Modal>

          <Loader style = {this.props.loadingModalStyle} color={this.props.color} size ="40px"></Loader>
        </div>
      }
      else if(this.state.isNetworkConnectionError)
      {
        button = <div>

        <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>
          
        </div>

        <Modal 
        modalStyle = {this.props.modalStyle}    
        >    
        </Modal>
        <Button onClick={this.switchNetwork} style = {this.props.buttonModalStyle} mainColor={this.props.color}>
          Switch to {this.getRequiredNetwork()}
        </Button>
        <div style ={this.props.errorModalStyle}>
          <p >Connection cancelled</p>
        </div >

        </div>
      }
      else if(this.state.isWalletConnectionError)
      {
        button = <div>
         

          <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>
          
          </div>

        <Modal 
        modalStyle = {this.props.modalStyle} 
        >    
        </Modal>
        <div onClick={this.requestAccounts}>
        <MetaMaskButton style = {this.props.buttonModalStyle} >Connect MetaMask</MetaMaskButton>
        </div>
        <div style ={this.props.errorModalStyle}>
          <p >Connection cancelled</p>
        </div >
        
        </div>
      }
      else if(this.state.isMetaMaskInstalled === false)
      {
        button = <div>
        <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>

        </div>
        
        <Modal 
        modalStyle = {this.props.modalStyle} 
        >    
        </Modal>
        <a target="_blank" href = "https://metamask.io/">
          <MetaMaskButton width={["100%", "auto"]} style = {this.props.buttonModalStyle}>
            Install MetaMask
          </MetaMaskButton>
        </a>
        
        
        
      </div>
      }
      else if(this.state.isCorrectNetwork)
      {
        button = <div>
        <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>

        </div>
        
        <Modal 
        modalStyle = {this.props.modalStyle} 
        >    
        </Modal>
        <div onClick={this.requestAccounts}>
          <MetaMaskButton style = {this.props.buttonModalStyle} >Connect MetaMask</MetaMaskButton>
        </div>
        
      </div>
      }
      else
      {
        button = <div>
        <div onClick={this.closeModal}>
          <ModalBackground modalBackgroundStyle = {this.props.modalBackgroundStyle}></ModalBackground>
          
        </div>
        
        <Modal 
        modalStyle = {this.props.modalStyle} 
        >    
        </Modal>
        <div>
        <Button onClick={this.switchNetwork} style = {this.props.buttonModalStyle} mainColor={this.props.color}>
          Switch to {this.getRequiredNetwork()}
        </Button>
        </div>
        
        </div>
      }
      
    }
    else{
      
      button = 
      <div>
        <Button onClick={this.openModal} style = {this.props.mainButtonStyle} mainColor={this.props.color}>Connect wallet</Button>
        
      </div>
      
    }
    
    return (

      <div>

          {this.state.isMetaMaskConnected === true && this.state.isCorrectNetwork === true ? (
            <div> 
              <Button.Outline style = {this.props.mainButtonStyle} mainColor={this.props.color} color ="black">
                {this.state.currentAccount}

              </Button.Outline>
              
            </div>
            
          ) : button}

      
      </div>


    );
  }
}

export default ConnectionBanner;
