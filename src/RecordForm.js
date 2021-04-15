import React from 'react';
import Grid from '@material-ui/core/Grid';
import TextField from '@material-ui/core/TextField';
import Button from '@material-ui/core/Button';
import Card from '@material-ui/core/Card';
import CardActions from '@material-ui/core/CardActions';
import CardMedia from '@material-ui/core/CardMedia';
import CircularProgress from '@material-ui/core/CircularProgress';
import grey from '@material-ui/core/colors/grey';

const defaultPhotoHash = 'QmQUp8vtD7uAdRudfi6zY5mJ6gtiopUN9sTSNct3Jvi1S8';
const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

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
      rTribe: '',
      rFamily: '',
      rCoffeeTrees: '',
      rPhotoHash: defaultPhotoHash,
      rLat: '',
      rLon: '',
      recordPhotoFile: '',
      // flag when uploading to IPFS
      isUploading: false
    };
    this.recordPhotoInput = React.createRef();
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
    this.setState({ isUploading: true });
    let file = e.target.files[0];
    let reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = async () => {
      // File is converted to a buffer to prepare for uploading to IPFS
      let buffer = await Buffer.from(reader.result);
      // Upload the file to IPFS and save the hash
      this.props.ipfs.add(buffer).then(result => {
        let fileHash = result[0].hash;
        console.log('Photo uploaded: ', fileHash);
        this.setState({
          rPhotoHash: fileHash,
          isUploading: false
        });
      }).catch(err => {
        console.log('Failed to upload the photo to IPFS: ', err);
      })
    };
  };

  removePhoto = () => {
    this.setState({
      rPhotoHash: defaultPhotoHash,
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
      rTribe: this.state.rTribe.trim(),
      rFamily: this.state.rFamily.trim(),
      rCoffeeTrees: this.state.rCoffeeTrees,
      rPhoto: this.state.rPhotoHash,
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
            rTribe: '',
            rFamily: '',
            rCoffeeTrees: '',
            rPhotoHash: defaultPhotoHash,
            rLat: '',
            rLon: '',
            recordPhotoFile: '',
          });
          this.updateCoords();
        });
      }
    });
  };

  render() {
    return (
      <form onSubmit={e => this.onSubmit(e)}>
        <Grid container spacing={24} style={{ width: 300, marginBottom: 50 }}>
          <Grid item xs={12}>
            <input
              className="record-photo-input"
              ref={this.recordPhotoInput}
              type="file"
              value={this.state.recordPhotoFile}
              onChange={this.captureFile}
            />
            <Card className="record-photo-card">
              {this.state.isUploading ? (
                <CircularProgress size={50} style={{ color: grey[200] }} className="record-photo-loader" />
              ) : null}
              <CardMedia
                className="record-photo-form-image"
                image={ipfsGatewayPrefix+this.state.rPhotoHash}
                title="Record Photo"
              />
              <CardActions className="record-photo-actions">
                <Button
                  size="small"
                  color="primary"
                  onClick={() => this.recordPhotoInput.current.click()}
                  className="record-photo-button"
                >
                  Upload Photo
                </Button>
                <Button
                  size="small"
                  color="primary"
                  className="record-photo-button"
                  onClick={this.removePhoto}
                >
                  Remove Photo
                </Button>
              </CardActions>
            </Card>
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="rTribe"
              placeholder="Tribe"
              label="Tribe"
              fullWidth={true}
              value={this.state.rTribe}
              onChange={this.change}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="rFamily"
              placeholder="Family"
              label="Family"
              fullWidth={true}
              value={this.state.rFamily}
              onChange={this.change}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              name="rCoffeeTrees"
              placeholder="Number of Coffee Trees"
              label="Coffee Trees"
              fullWidth={true}
              value={this.state.rCoffeeTrees}
              onChange={this.change}
            />
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
              style={{ marginTop: 7 }}
            >
              Add
            </Button>
          </Grid>
        </Grid>
      </form>
    );
  }
}

export default RecordForm;
