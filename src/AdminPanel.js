import React from 'react';
import RecordForm from "./RecordForm";
import EditableTable from "./EditableTable";
import Grid from '@material-ui/core/Grid';
import Map from './Map';
import ReactAudioPlayer from 'react-audio-player';
import ModalImage from "react-modal-image";


const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

const GPSmult = 100000000;

const fileTypes = ['Photo', 'Text', 'Audio', 'Video'] //enums are cast as numbers in solidity, so I get the index of the item in the array
/**
 * A list of records with a form to add a new record and edit/remove functionality
 * @param records - list of records
 * @param setRecords - function to update records
 * @param web3 - instance of web3
 * @param contract - instance of the smart contract
 * @param account - address of the user
 * @param ipfs - IPFS interface
 */
class AdminPanel extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      // the index of the row that's being edited right now, -1 means none are edited
      editRecordIdx: -1,
      // errors to display during the edit mode
      editRecordErrors: {},
      // saved version of an record before editing, to restore the values on cancel
      recordBeforeEditing: null,
      editRecordFile: '',
      isEditUploading: false,
      isContractPaused: false,
      isPausing: false,
      isUnpausing: false
    }
    this.editRecordInput = React.createRef()
  }

  /**
   * Validate the input before an record is added/changed.
   * This function is made asynchronous because it may execute a contract call,
   * and contract calls must be executed asynchronously.
   * @param {object} record - object containing record data: rName, rOwner
   * @return {Promise} - promise that will resolve to an object of errors; empty object means no errors
   */
  recordValidate = (record) => {
    let errors = {};
    // if (record.rSpecies.length < 1) {
    //   errors.rSpeciesError = 'Species must not be empty';
    // }
    return new Promise((resolved, rejected) => {
      resolved(errors);
    });
  }

  /** Add a new record to the contract and update the state to display the change */
  recordSubmit = (record, onSuccess) => {
    // Add the new record to the list, but grayed out (inProgress: true)
    // It will update to normal automatically when the transaction completes
    this.props.setRecords(
      [...this.props.records, {
        rTime: null,
        rFile: { hash: record.rFile.hash, type: record.rFile.type },
        rLat: record.rLat,
        rLon: record.rLon,
        inProgress: true
      }]
    );
        // Add the record to the contract
    this.props.contract.methods.addRecord(
      { IPFS: record.rFile.hash, fileType:fileTypes.indexOf(record.rFile.type)},
      Math.round(record.rLat*GPSmult),
      Math.round(record.rLon*GPSmult)
    ).send({
      from: this.props.account
    }).then(() => {
      // cool
      onSuccess();
    }).catch(error => {
      console.log(error);
      // Remove the pending record
      this.props.setRecords(
        this.props.records.filter(rec => rec.inProgress !== true)
      );
    });
  }

  render() {
    var records = this.props.records;
    var points = records.length > 0 ? records.map(rec => ({ "lat": parseFloat(rec.rLat), "lng": parseFloat(rec.rLon) })) : [];
    return (
      <div>
        {/* <h1>Records</h1> */}
        <Grid container >
          <Grid item xs={12} sm={5}>
            <h2 style={{ marginLeft: '20px' }}>Add a record</h2>
            <RecordForm
              onValidate={this.recordValidate}
              onSubmit={this.recordSubmit}
              ipfs={this.props.ipfs}
            />
          </Grid>
          <Grid item xs={12} sm={7}>
              <Map 
              points={points}
              containerStyle={{
                width: 'calc(100% - 40px)',
                marginLeft:'20px',
                height: '425px',
                position: 'relative',}}
            />
          </Grid>
            <Grid item xs={12} >
            <h2 className='records'>Records</h2>
            <EditableTable
              handleChange={this.onInputChanged}
              handleRemove={this.recordRemove}
              startEditing={this.startEditing}
              finishEditing={this.finishEditing}
              cancelEditing={this.cancelEditing}
              editIdx={this.state.editRecordIdx}
              data={this.props.records}
              dataErrors={this.state.editRecordErrors}
              dataStructure={[
                {
                  name: 'Time',
                  prop: 'rTime',
                  editable: false,
                  type: 'datetime'
                },
                {
                  name: 'File',
                  prop: 'rFile',
                  editable: false,
                  type: 'custom',
                  renderField: (value) => {
                    return (
                      <div className='media-container'>
                        {(() => {
                          if (value.type === 'Photo') {
                            return (
                              <ModalImage
                                small={ipfsGatewayPrefix + value.hash}
                                large={ipfsGatewayPrefix + value.hash}
                                hideZoom
                                imageBackgroundColor="#ffffff00"
                                alt=""
                                className= "preview"
                              />
                            )
                          }
                          if (value.type === 'Text') {
                            return (<iframe title="Text File" src={ipfsGatewayPrefix + value.hash} className="preview"></iframe>)
                          }
                          if (value.type === 'Audio') {
                            return (<ReactAudioPlayer src={ipfsGatewayPrefix + value.hash} className="preview" controls />)
                          }
                          if (value.type === 'Video') {
                            return(<video controls src={ipfsGatewayPrefix + value.hash} className="preview">
                                    Sorry, your browser doesn't support embedded videos,
                                    but don't worry, you can <a href={ipfsGatewayPrefix + value.hash}>download it</a>
                                    and watch it with your favorite video player!</video>)
                          }
                          return(<div>{value.hash}</div>)
                      })()}
                      </div>
                    )
                  }
                },
                {
                  name: 'Latitude',
                  prop: 'rLat',
                  editable: false,
                  type: 'text'
                },
                {
                  name: 'Longitude',
                  prop: 'rLon',
                  editable: false,
                  type: 'text'
                },
              ]} />
          </Grid>  
        </Grid>
      </div>
    );
  }
}

export default AdminPanel;