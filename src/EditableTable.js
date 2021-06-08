import React from 'react';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableRow from '@material-ui/core/TableRow';
import TableCell from '@material-ui/core/TableCell';
import IconButton from '@material-ui/core/IconButton';
import EditIcon from '@material-ui/icons/Edit';
import DeleteIcon from '@material-ui/icons/Delete';
import CheckIcon from '@material-ui/icons/Check';
import CloseIcon from '@material-ui/icons/Close';
import TextField from '@material-ui/core/TextField';
import Tooltip from '@material-ui/core/Tooltip';
import CircularProgress from '@material-ui/core/CircularProgress';
import { withStyles } from '@material-ui/core/styles';

function formatDate(timestamp) {
  const addZero = i => (i < 10 ? "0" + i : i);
  var timezone = new Date().getTimezoneOffset();
  let d = new Date(timestamp * 1000 - timezone*60*1000);
  let day = addZero(d.getUTCDate());
  let month = addZero(d.getUTCMonth() + 1);
  let year = addZero(d.getUTCFullYear());
  let hours = addZero(d.getUTCHours());
  let minutes = addZero(d.getUTCMinutes());
  return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes;
}


// Customizing the look of the table cells
const CustomTableCell = withStyles(theme => ({
  head: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    fontSize: 14
  },
  body: {
    wordBreak: 'break-word',
    paddingTop: '20px',
    paddingBottom: '13px',
    paddingLeft: '5px',
    paddingRight: '5px',
    fontSize: 15
  }
}))(TableCell);

/**
 * A table with data that can be edited.
 * This is a stateless component. Make sure to maintain the data in your state outside.
 * @param data - the data to be displayed in the table
 * @param dataErrors - the errors to be displayed when in the edit mode
 * @param dataStructure - list of data columns, each must include:
 *  - string name: the column name to be displayed
 *  - string prop: must be same as the corresponding key in "data"
 *  - boolean editable: whether this data can be edited or not
 *  - string errorProp: must be same as the corresponding key in "dataErrors"
 *  - function renderField: optional function to render custom fields
 *  - function renderEditField: optional function to render custom editable fields
 *  this parameter can be skipped when "editable" is false
 * @param editIdx - index of the row currently being edited, -1 means edit mode is off
 * @param handleChange - function to be called whenever an input is changed (in edit mode)
 * @param startEditing - function to be called when edit mode is turned on
 * @param finishEditing - function to be called to submit the edited data
 * @param cancelEditing - function to be called to cancel editing and quit the edit mode
 * @param handleRemove - function to be called to remove a row from the data
 */
class EditableTable extends React.Component {
 constructor(props) {
    super(props)
    this.state = {
      sort:false
    }
  }
  /** Render the table header with given data columns */
  renderHeaderRow() {
    const { dataStructure } = this.props;

    return dataStructure.map((dataColumn, columnIdx) => {
      return (
        <CustomTableCell key={`thc-${columnIdx}`}>
          {columnIdx === 0 ? <button onClick={() => { this.setState({sort:!this.state.sort})}} className="sortArrow">{dataColumn.name} {this.state.sort?<span>&#9650;</span>:<span>&#9660;</span>}</button> : <span>{dataColumn.name}</span>}
        </CustomTableCell>
      );
    });
  }

  /**
   * Render a field with data, an editable text field when in edit mode
   * and just a plain text otherwise
   */
  renderEditableField(dataColumn, dataRow, rowIdx) {
    const { editIdx, dataErrors, handleChange } = this.props;
    let value = dataRow[dataColumn.prop];
    switch (dataColumn.type) {
      case 'datetime':
        value = formatDate(value);
        break;
      case 'custom': break;
      case 'text': break;
      default:
        if (typeof(value) !== 'undefined') {
          value = value.toString();
        }
        break;
    }
    if (dataColumn.editable && editIdx === rowIdx) {
      if (dataColumn.type === 'custom') {
        return dataColumn.renderEditField(value);
      }
      return (
          <TextField
            name={dataColumn.prop}
            value={value}
            onChange={(e) => handleChange(e, dataColumn.prop, rowIdx)}
            label={dataColumn.name}
            helperText={dataErrors[dataColumn.errorProp]}
            error={dataErrors[dataColumn.errorProp] && dataErrors[dataColumn.errorProp].length > 0}
            fullWidth={true}
          />
        );
    }
      if (dataColumn.type === 'custom') {
        return dataColumn.renderField(value);
      }
      return value;
    
  };

  /** Render buttons "edit", "remove", "save", "cancel" depending on the mode */
  renderActionButtons(rowIdx) {
    const { editIdx, startEditing, finishEditing, cancelEditing, handleRemove } = this.props;

    return (
      <div className="action-buttons">
        {editIdx === rowIdx ? (
          <span>
            <Tooltip title="Save">
              <IconButton color="primary" onClick={() => finishEditing()}>
                <CheckIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Cancel">
              <IconButton color="primary" onClick={() => cancelEditing()}>
                <CloseIcon />
              </IconButton>
            </Tooltip>
          </span>
        ) : (
            <Tooltip title="Edit">
              <IconButton color="primary" onClick={() => startEditing(rowIdx)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
          )}
        <Tooltip title="Delete">
          <IconButton color="primary" onClick={() => handleRemove(rowIdx)}>
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </div>
    );
  }

  /** Render the table body with all the data, editable data fields and action buttons */
  renderTableBody() {
    const { data, dataStructure } = this.props;
    //console.log(data,dataStructure)
    if (this.state.sort) {
      data.sort((a, b) => {
        return b[dataStructure[0].prop] - a[dataStructure[0].prop];
      })
    }
    else {
      data.sort((a, b) => {
        return a[dataStructure[0].prop] - b[dataStructure[0].prop];
      })
    }
    return data.map((dataRow, rowIdx) => {
      if (dataRow.inProgress) {
        return (
          <TableRow
            key={`tr-${rowIdx}`}
            className="row-disabled"
          >
            {dataStructure.map((dataColumn, columnIdx) => (
              <CustomTableCell key={`trc-${columnIdx}`}  >
                {columnIdx === 0 ? <CircularProgress size={20} /> : null}
                {dataColumn.type === 'custom'
                  ? dataColumn.renderField(dataRow[dataColumn.prop])
                  : dataRow[dataColumn.prop]}
              </CustomTableCell>
            ))}
          </TableRow>
        );
      } else {
        return (
          <TableRow key={`tr-${rowIdx}`}>
            {dataStructure.map((dataColumn, columnIdx) => (
              <CustomTableCell key={`trc-${columnIdx}`}>
                {this.renderEditableField(dataColumn, dataRow, rowIdx)}
              </CustomTableCell>
            ))}
            {/* <CustomTableCell style={{ textAlign: 'center' }}>
              {this.renderActionButtons(rowIdx)}
            </CustomTableCell> */}
          </TableRow>
        );
      }
    });
  }

  render() {
    return (
      <Table>
        <TableHead>
          <TableRow>
            {this.renderHeaderRow()}
            {/* <CustomTableCell style={{ textAlign: 'center' }}>
              Actions
            </CustomTableCell> */}
          </TableRow>
        </TableHead>
        <TableBody>{this.renderTableBody()}</TableBody>
      </Table>
    );
  }
}

export default EditableTable;
