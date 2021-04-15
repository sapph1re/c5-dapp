import React from 'react';
import RecordForm from "./RecordForm";
import EditableTable from "./EditableTable";
import Grid from '@material-ui/core/Grid';
import Map from './Map';

const ipfsGatewayPrefix = 'https://ipfs.io/ipfs/';

const GPSmult = 100000000;

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
    super(props);

    this.state = {
      // the index of the row that's being edited right now, -1 means none are edited
      editRecordIdx: -1,
      // errors to display during the edit mode
      editRecordErrors: {},
      // saved version of an record before editing, to restore the values on cancel
      recordBeforeEditing: null,
      editRecordPhotoFile: '',
      isEditUploading: false,
      isContractPaused: false,
      isPausing: false,
      isUnpausing: false
    };

    this.editRecordPhotoInput = React.createRef();
  }

  /**
   * Validate the input before an record is added/changed.
   * This function is made asynchronous because it may execute a contract call,
   * and contract calls must not be executed synchronously.
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
        rTribe: record.rTribe,
        rFamily: record.rFamily,
        rCoffeeTrees: record.rCoffeeTrees,
        rPhoto: record.rPhoto,
        rLat: record.rLat,
        rLon: record.rLon,
        inProgress: true
      }]
    );
    // Add the record to the contract
    this.props.contract.methods.addRecord(
      record.rTribe,
      record.rFamily,
      record.rCoffeeTrees,
      record.rPhoto,
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
    if (records.length > 0) {
      var points = records.map(rec => ({
          "lat": parseFloat(rec.rLat),
          "lng": parseFloat(rec.rLon)
      }));
    }
    return (
      <div>
        {/* <h1>Records</h1> */}
        <Grid container spacing={24}>
          <Grid item xs={4}>
            <h2>Add a record</h2>
            <RecordForm
              onValidate={this.recordValidate}
              onSubmit={this.recordSubmit}
              ipfs={this.props.ipfs}
            />
          </Grid>
          <Grid item xs={8}>
            {records.length > 0 ?
              <Map 
                points={points}
                style = {{
                  width: '60%',
                  height: '500px'
                }} />
            :""}
          </Grid>
          <Grid item xs={12}>
            <h2>Records</h2>
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
                  name: 'Photo',
                  prop: 'rPhoto',
                  editable: false,
                  type: 'custom',
                  renderField: (value) => (
                    <img src={ipfsGatewayPrefix + value} className="record-photo" alt="photo" />
                  )
                },
                {
                  name: 'Tribe',
                  prop: 'rTribe',
                  editable: false,
                  type: 'text'
                },
                {
                  name: 'Family',
                  prop: 'rFamily',
                  editable: false,
                  type: 'text'
                },
                {
                  name: 'Coffee Trees',
                  prop: 'rCoffeeTrees',
                  editable: false,
                  type: 'text'
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