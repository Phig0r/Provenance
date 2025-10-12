// contracts/libraries/LibAppStorage.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../storage/AppStorage.sol";

library LibAppStorage {

    /**
     * @notice Returns a pointer to the AppStorage struct.
     */
    function appStorage() internal pure returns (AppStorage storage s) {
        bytes32 position = keccak256("diamond.standard.app.storage");
        assembly {
            s.slot := position
        }
    }
}