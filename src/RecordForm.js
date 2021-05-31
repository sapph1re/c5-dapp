import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import CircularProgress from '@material-ui/core/CircularProgress';

const defaultFile = { hash: 'QmQUp8vtD7uAdRudfi6zY5mJ6gtiopUN9sTSNct3Jvi1S8', type: 'Photo'};

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
      // flag when uploading to IPFS
      isUploading: false
    };
    this.recordFileInput = React.createRef();
  }

  componentDidMount() {
    this.updateCoords();
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

  captureFile = (e) => {
    e.stopPropagation();
    e.preventDefault();
    let file = e.target.files[0];
    this.setState({ isUploading: true, rFileName: file.name });
    // Acceptable file types
    const fileTypes = ['jpg', 'jpeg', 'png', 'txt', 'mp3', 'mp4'];
    // Get file extention
    const extension = file.name.split('.').pop().toLowerCase();
    if (!fileTypes.includes(extension)) {
      this.setState({
        isUploading: false,
        rFileName: '' 
      })
      return
    }
    
    const fileType = (extension) => {
        if (extension === 'jpg' || extension === 'jpeg' || extension === 'png') {
          return 'Photo'
        }
        if (extension === 'mp3') {
          return 'Audio'
        }
        if (extension === 'mp4') {
          return 'Video'
        }
        if (extension === 'txt') {
          return 'Text'
        }
        return 'Photo'
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
          rFile: { hash: fileHash, type: fileType(extension)},
          isUploading: false
        });
      }).catch(err => {
        console.log('Failed to upload the file to IPFS: ', err);
      })
    };
  };

  removeFile = () => {
    this.setState({
      rFile: defaultFile,
      rFileName: '',
      isUploading: false
    });
  }

  /** Submit the data */
  onSubmit = e => {
    e.preventDefault();
    // Clear the errors first
    this.setState({
      // rSpeciesError: ''
    });
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
            rFile: defaultFile,
            rLat: '',
            rLon: '',
            recordFile: '',
          });
          this.updateCoords();
        });
      }
    });
  };

  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>
        <Grid container style={{marginLeft: '20px', width:'calc(100% - 40px)', marginBottom: 50}}>
          <Grid item xs={12}>
            <input
              className="record-photo-input"
              ref={this.recordFileInput}
              type="file"
              value={this.state.recordFile}
              onChange={this.captureFile}
            />
            <div>
              File:
              <button
                type="button"
                onClick={() => this.recordFileInput.current.click()}
                style={{ marginLeft: '7px', backgroundColor: '#f2f2f2', border: '1px solid #bbbbbb', height: '21px', paddingTop: '2px', borderRadius: '3px',cursor:'pointer' }}>
                Choose File
              </button>
              {this.state.rFileName!=='' ? (
                <span
                  style={{ marginLeft: '5px' }}>
                  {this.state.rFileName}
                  <button type="button"
                    onClick={this.removeFile}
                    style={{ backgroundColor: 'transparent', border: 'none', color: '#cc0000', padding: '0', marginLeft: '3px', cursor: 'pointer' }}>
                    &#10006;
                  </button>
                </span>
              ) : null}
            </div>
          </Grid>
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
              disabled={this.state.isUploading}
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
