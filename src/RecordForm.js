import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';
import { ReactMediaRecorder } from "react-media-recorder";
import WaveSurfer from 'wavesurfer.js';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlay,faPause,faMicrophone,faMicrophoneSlash,faTimes,faPencilAlt, faCheck, faCamera,faFile,faVideo } from '@fortawesome/free-solid-svg-icons'
import Webcam from "react-webcam";

const defaultFile = ''
 
 var recorder;
/**
 * A form to create a new Record
 * @param onValidate - function to be called to validate the data before submitting
 * @param onSubmit - function to be called to submit the data
 */
class RecordForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // input data
      rFile: defaultFile,
      rFileName:'',
      rLat: '',
      rLon: '',
      recordFile: '',
      textInput: { target: {value:''}},
      playing: false,
      actionState:'textTyping',
      // flag when uploading to IPFS
      isUploading: false,
      recordedVideoChunks: '',
      errorMessage:''
    };
    this.webcamRef = React.createRef();
    this.webcamVideoRef = React.createRef();
    this.recordFileInput = React.createRef();

  }

  componentDidMount () {
    this.updateCoords();

    //create waveform
    this.waveform = WaveSurfer.create({
      barWidth: 3,
      cursorWidth: 1,
      container: '#waveform',
      backend: 'WebAudio',
      barHeight: 1,
      hideScrollbar: true,
      normalize:true,
      height: 29,
      progressColor: '#4070FF',
      responsive: true,
      waveColor: '#99abe0',
      barMinHeight:1,
      cursorColor: 'transparent',
    });
    const self = this;
    self.waveform.on('finish', function () {
      self.setState({ playing: false });
    });
  }

  updateCoords = () => {
    // input current coordinates into the form
    window.navigator.geolocation.getCurrentPosition(pos => {
      this.setState({
        rLat: pos.coords.latitude.toFixed(8),
        rLon: pos.coords.longitude.toFixed(8),
      });
    });
  }

  /** Update the data in the state whenever an input value is changed */
  change = e => {
    this.setState({
      [e.target.name]: e.target.value
    });
  };


  toggleVideoCapture = () => {
    if (this.state.actionState === 'openVideoCapturing') {
      this.setState({ actionState: 'videoCapturing' })
      recorder = new MediaRecorder(this.webcamVideoRef.current.stream, {
        mimeType: 'video/webm;codecs=vp9'
      });
      recorder.addEventListener(
        "dataavailable",
        (({ data }) => {
          if (data.size > 0) {
            const file = new File([data], "video.webm", { type: "video/webm" })
            this.setState({ actionState: 'videoCaptured' })
            this.uploadToIPFS(file)
          }
        }
        )
      )
      recorder.start();
      return
    }
    recorder.stop();
    this.setState({ actionState: '' })
  }

/**
 * Convert a base64 string in a Blob according to the data and contentType.
 * 
 * @param b64Data {String} Pure base64 string without contentType
 * @param contentType {String} the content type of the file i.e (image/jpeg - image/png - text/plain)
 * @param sliceSize {Int} SliceSize to process the byteCharacters
 * @see http://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
 * @return Blob
 */
 b64toBlob(b64Data, contentType, sliceSize) {
        contentType = contentType || '';
        sliceSize = sliceSize || 512;
        var byteCharacters = atob(b64Data);
        var byteArrays = [];
        for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
            var slice = byteCharacters.slice(offset, offset + sliceSize);
            var byteNumbers = new Array(slice.length);
            for (var i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }
            var byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }
      var blob = new Blob(byteArrays, {type: contentType});
      return blob;
  }

  /**
 * Captures the photo from the {ref = {webcamRef}} component, transforms it from Base64 to the Blob and uploads it to the IPFS
 */
  capturePhoto = () => {
    this.setState({ actionState: '' })
    const photo_b64 = this.webcamRef.current.getScreenshot()
    if (photo_b64) {
      var block = photo_b64.split(";");
      const contentType = block[0].split(":")[1];
      const realData = block[1].split(',')[1];
      const file_blob = this.b64toBlob(realData, contentType);
      const file = new File([file_blob], "photo.jpeg", { type: contentType })
      this.setState({ actionState: 'photoCaptured' })
      this.uploadToIPFS(file)
    }
  }

  /**
 * Captures an audio file from the recorder, transforms it into a blob and uploads to the IPFS
 * @param url {String} url from the {ReactMediaRecorder} component
 */
  captureAudioFile = async (url) => {
    //load waveform
    this.waveform.load(document.querySelector('#track'))
    //load file
    let file = await fetch(url)
      .then(r => r.blob())
      .then(blobFile => new File([blobFile], "audioFile.mp3", { type: "audio/mpeg" }))
    this.uploadToIPFS(file)
  }
  
 /**
 * Captures the file of any type and uploads it the IPFS
 */
  captureFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    let file = e.target.files[0];
    this.setState({ actionState: 'fileCaptured' });
    this.uploadToIPFS(file).catch((err) => {
      console.log(err)
    })
  };

  /**
  *Checks the type of the file, writes it to the state and uploads to the IPFS.
  * @param file {File} the file to upload
  * @return Promise
  */
  uploadToIPFS(file) {
    return new Promise((resolve, reject) => {
      if (!file) {
        return reject(new Error("No file passed to the 'uploadToIPFS' function"))
      }
      this.setState({ isUploading: true, rFileName: file.name,  errorMessage: '' });
      // Acceptable file types
      const fileTypes = ['jpg', 'jpeg', 'png', 'txt', 'pdf', 'mp3', 'mp4','webm'];
      // Get file extention
      const extension = file.name.split('.').pop().toLowerCase();
      if (!fileTypes.includes(extension)) {
        this.setState({
          isUploading: false,
          rFileName: '',
          actionState:'',
          errorMessage: "Wrong file extension. The acceptable file extentions are: " + fileTypes.toString()
        })
        return reject(new Error("Wrong file extension"))
      }
      const fileType = (extension) => {
        if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
          return 'Photo'
        }
        if (extension === 'mp3') {
          return 'Audio'
        }
        if (extension === 'mp4' || extension === 'webm') {
          return 'Video'
        }
        if (extension === 'txt') {
          return 'Text'
        }
        if (extension === 'pdf') {
          return 'PDF'
        }
      }
      let reader = new window.FileReader();
      reader.readAsArrayBuffer(file);
      reader.onloadend = async () => {
        // File is converted to a buffer to prepare for uploading to IPFS
        let buffer = await Buffer.from(reader.result);
        // Upload the file to IPFS and save the hash
        this.props.ipfs.add(buffer).then(result => {
          let fileHash = result[0].hash;
          this.setState({
            rFile: { hash: fileHash, type: fileType(extension) },
            isUploading: false
          }, () => { console.log('The file has been uploaded to the IPFS: ', this.state.rFile);});
           return resolve()
        }).catch(err => {
          return reject(err);
        })
      }
    })
  }

  closeVideo = () => {
    this.setState({ actionState: '' })
    this.removeFile()
  }
  closePhoto = () => {
    this.setState({ actionState: '' })
    this.removeFile()
  }
  playAudio = () => {
    this.setState({ playing: !this.state.playing });
    this.waveform.playPause();
  };

  closeAudio = () => {
    this.setState({actionState: '', playing: false })
    this.removeFile()
  }
  removeFile = () => {
    this.setState({
      rFile: defaultFile,
      rFileName: '',
      isUploading: false
    });
  }

  /** Submit the data */
  onSubmit = async e => {
    e.preventDefault();
    if (this.state.actionState === 'textTyping') {
      let file = new File([this.state.textInput.target.value?this.state.textInput.target.value:''], "file.txt", {
      type: "text/plain",
      });
      try {
        await this.uploadToIPFS(file)
      }
      catch{
        return
      }
    }
    // Extract and format the data
    let data = {
      rFile: this.state.rFile,
      rLat: this.state.rLat,
      rLon: this.state.rLon,
    };
    // Validate the data
    this.props.onValidate(data).then(errors => {
      if (Object.keys(errors).length > 0) {
        // Set errors if any
        this.setState(errors);
      } else {
        // Submit the data
        this.props.onSubmit(data, () => {
          // When done, clear the form
          this.setState({
            actionState:'',
            rFile: defaultFile,
            rLat: '',
            rLon: '',
            recordFile: '',
          });
          this.updateCoords();
        });
      }
    })
  };
 
  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>

         { (this.state.actionState === 'openVideoCapturing' || this.state.actionState === 'videoCapturing') ?
          <div className="webCamContainer">
                  <Webcam
                    audio={true}
                    ref={this.webcamVideoRef}
                    videoConstraints={{ facingMode: "environment" }}
                    className="webCam"
                  />
            <button className="capturePhoto" type="button" onClick={this.toggleVideoCapture}><div className="outerCircle"></div></button>
            <button className="closePhoto" type="button" onClick={this.closeVideo}> <FontAwesomeIcon  icon={faTimes}/></button>
          </div> : null}
        
        {this.state.actionState === 'photoCapturing' ?
          <div className="webCamContainer">
                  <Webcam
                    audio={false}
                    ref={this.webcamRef}
                    videoConstraints={{ facingMode: "environment" }}
                    screenshotFormat="image/jpeg"
                    className="webCam"
                  />
            <button className="capturePhoto" type="button" onClick={this.capturePhoto}><div className="outerCircle"></div></button>
            <button className="closePhoto" type="button" onClick={this.closePhoto}> <FontAwesomeIcon  icon={faTimes} /></button>
          </div> : null}
        
        <Grid container style={{marginLeft: '20px', width:'calc(100% - 40px)', marginBottom: 50}}>
          <Grid item xs={12}>
            <input
              className="record-photo-input"
              ref={this.recordFileInput}
              type="file"
              value={this.state.recordFile}
              onChange={this.captureFile}
            />
            <div style={{ position: 'relative' }}>

              <div className={ this.state.actionState === 'textTyping' ? 'activePencilContainer' : 'PencilContainer'}>
                <button type="button" className="PlayButton" onClick={() => { this.closeAudio(); this.setState({ actionState: this.state.actionState === 'textTyping' ? '' : 'textTyping' }) }}>
                  <FontAwesomeIcon className="microphoneIcon" icon={faPencilAlt} /> 
                </button> 
                <input onChange={(text)=>this.setState({ textInput: text })} placeholder="Input your notes" className="text-input" type="text" />
              </div>
              
               <ReactMediaRecorder
                audio
                blobPropertyBag={{ type: "audio/mpeg" }}
                onStop={(blobUrl) => (this.captureAudioFile(blobUrl))}
                  render={({startRecording, stopRecording, mediaBlobUrl }) => (

                      <div className={ this.state.actionState === 'recorded' ? 'WaveformContainer' : 'activeWaveformContainer'} >
                        {this.state.actionState ==='recorded' ?
                          <div>
                            <button type="button" className="PlayButton" onClick={this.playAudio} >
                              {!this.state.playing ? <FontAwesomeIcon className="playIcon" icon={faPlay} /> : <FontAwesomeIcon className="pauseIcon" icon={faPause} />}
                            </button>
                              <button type="button" className="closeButton" onClick={this.closeAudio}>
                                <FontAwesomeIcon className="playIcon" icon={faTimes} />
                              </button>
                            </div> :
                             <div>
                              {this.state.actionState !=='recording' ?
                              <button type="button" className="PlayButton" onClick={() => { this.setState({ actionState: 'recording' }); startRecording() }}>
                                <FontAwesomeIcon className="microphoneIcon" icon={faMicrophone} />
                              </button> :
                                      <div>
                                        <div className="startRecording">
                                          <div className="blob" >
                                            <svg  width="100" height="100" viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg">
                                              <path fill="#4070FF30" d="M65.5,-21.2C73.7,4,61.5,35.9,38.3,52.7C15.1,69.6,-19.1,71.5,-37.6,56.8C-56.1,42.2,-58.9,11.1,-50,-15C-41.2,-41.1,-20.6,-62.1,4,-63.4C28.7,-64.7,57.3,-46.3,65.5,-21.2Z" transform="translate(100 100)" />
                                            </svg>
                                          </div>
                                          <div className=" blob reverse">
                                            <svg  width="100" height="100" viewBox="0 0 190 190" xmlns="http://www.w3.org/2000/svg">
                                                <path fill="#4070FF30" d="M65.5,-21.2C73.7,4,61.5,35.9,38.3,52.7C15.1,69.6,-19.1,71.5,-37.6,56.8C-56.1,42.2,-58.9,11.1,-50,-15C-41.2,-41.1,-20.6,-62.1,4,-63.4C28.7,-64.7,57.3,-46.3,65.5,-21.2Z" transform="translate(100 100)" />
                                            </svg>
                                          </div>
                                        </div>
                                        <button
                                          type="button"
                                          className="PlayButton"
                                          style={{ zIndex: 999 }}
                                          onClick={() => { this.setState({ actionState: 'recorded'}); stopRecording() }}>
                                          <FontAwesomeIcon className="microphoneIcon" icon={faMicrophoneSlash} />
                                        </button>
                                      </div>
                                    }
                              </div>
                                }
                                <div className={ this.state.actionState ==='recorded' ? 'activeWave' : 'Wave'} id="waveform" />
                                <audio id="track" src={mediaBlobUrl}/>
                              </div>
                          )}/> 

              <div className={this.state.actionState === 'photoCaptured' ? 'activePhotoContainer' : 'PhotoContainer'}>
                {this.state.actionState === 'photoCaptured' ? <FontAwesomeIcon className="checkPhoto" icon={faCheck} /> : null}
                <button  type="button" className="PlayButton" onClick={() => { this.removeFile(); this.setState({ actionState: 'photoCapturing' }) }} >
                  <FontAwesomeIcon className="photoIcon" icon={faCamera} />
                </button> 
              </div>

              <div className={this.state.actionState === 'videoCaptured' ? 'activePhotoContainer' : 'PhotoContainer'}>
                {this.state.actionState === 'videoCaptured' ? <FontAwesomeIcon className="checkPhoto" icon={faCheck} /> : null}
                <button  type="button" className="PlayButton" onClick={() => { this.removeFile(); this.setState({ actionState: 'openVideoCapturing' }) }} >
                  <FontAwesomeIcon className="videoIcon" icon={faVideo} />
                </button> 
              </div>

              <div className={ this.state.actionState === 'fileCaptured' ? 'activeFileContainer' : 'FileContainer'}>
                {this.state.actionState === 'fileCaptured' ?<div className="fileName">{this.state.rFileName}</div> : null}
                <button
                  type="button"
                  onClick={() => { this.recordFileInput.current.click() }}
                  className="PlayButton">
                  <FontAwesomeIcon className="fileIcon" icon={faFile} />
                </button>
              </div>
            </div>
          </Grid>
          {this.state.errorMessage !== '' ? <div className="errorMessage">{ this.state.errorMessage }</div>:null}
          <Grid item xs={12}>
            <TextField
              name="rLat"
              placeholder="Latitude"
              label="Latitude"
              fullWidth={true}
              value={this.state.rLat}
              onChange={this.change}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="rLon"
              placeholder="Longitude"
              label="Longitude"
              fullWidth={true}
              value={this.state.rLon}
              onChange={this.change}
            />
          </Grid>
          <Grid item xs={12}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={
                !this.props.isRightChain ||
                this.props.account === null ||
                this.state.isUploading ||
                (this.state.textInput.target.value === '' && this.state.actionState === 'textTyping') ||
                (this.state.rFile === defaultFile && this.state.actionState !== 'textTyping')}
              style={{ marginTop: 7, height:'38px' }}
            >
               {this.state.isUploading ? (
                <CircularProgress size={20} style={{ color: '#606060' }}  />
              ) : <span>Add</span>}
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  }
}

export default RecordForm;
