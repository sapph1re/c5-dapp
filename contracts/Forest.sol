// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Forest tracking platform
 * @author Roman Vinogradov <dev.romanv@gmail.com>
 */
contract Forest {

  struct Record {
    // Record timestamp
    uint256 rTime;
    // Name of the tribe
    string rTribe;
    // Name of the family in the tribe
    string rFamily;
    // Number of coffee trees
    uint256 rCoffeeTrees;
    // IPFS hash of the photo
    string rPhoto;
    // GPS coordinates of the plant, multiplier 100000000
    int256 rLat;
    int256 rLon;
  }

  // List of records
  Record[] public records;

  event LogRecordAdded();

  receive() external payable {
    revert("Payments are not accepted");
  }

  function getRecordsCount() public view returns (uint256) {
    return records.length;
  }

  function addRecord(string memory _rTribe, string memory _rFamily, uint256 _rCoffeeTrees, string memory _rPhoto, int256 _rLat, int256 _rLon) public {
    // add a new Record record to the list
    records.push(Record(block.timestamp, _rTribe, _rFamily, _rCoffeeTrees, _rPhoto, _rLat, _rLon));
    emit LogRecordAdded();
  }
}
