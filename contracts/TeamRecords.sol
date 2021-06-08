// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Forest tracking platform
 * @author Roman Vinogradov <dev.romanv@gmail.com>
 */
contract TeamRecords {
    enum FileType {Photo, Text, Audio, Video, PDF}
    struct File {
        string IPFS;
        FileType fileType;
    }

    /**
     * @dev Record:
     * {rTime} - timestamp of the record
     * {rFile} - IPFS hash of the photo + FileType enum
     * {rLat, rLon} - GPS coordinates of the plant multiplied by 100000000
     */
    struct Record {
        uint256 rTime;
        File rFile;
        int256 rLat;
        int256 rLon;
    }

    /**
     * @dev List of records
     */
    Record[] public records;

    /**
     * @dev Events:
     * {LogRecordAdded} - emits on addRecord
     */
    event LogRecordAdded();

    receive() external payable {
        revert("Payments are not accepted");
    }

    /**
     * @dev getRecordsCount
     * Returns the length of the records array
     */
    function getRecordsCount() public view returns (uint256) {
        return records.length;
    }

    /**
     * @dev addRecord
     * Creates new record and emits {LogRecordAdded} event
     */
    function addRecord(
        File memory _rFile,
        int256 _rLat,
        int256 _rLon
    ) public {
        records.push(Record(block.timestamp, _rFile, _rLat, _rLon));
        emit LogRecordAdded();
    }
}
