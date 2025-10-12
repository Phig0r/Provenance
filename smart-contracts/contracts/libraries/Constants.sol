// contracts/libraries/Constants.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

library Constants {
   bytes32 constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
   bytes32 constant BRAND_ROLE = keccak256("BRAND_ROLE");
   bytes32 constant RETAILER_ROLE = keccak256("RETAILER_ROLE");
   
   //Access Control
   bytes32 constant DEFAULT_ADMIN_ROLE = 0x00;
}