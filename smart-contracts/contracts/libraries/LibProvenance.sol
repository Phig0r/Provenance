// contracts/libraries/LibProvenance.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../storage/AppStorage.sol";

import "./LibAppStorage.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

library LibProvenance {

   /**
    * @dev Checks if a brand profile has been created for a given address.
    * Relies on the fact that the registrationTimestamp is only set once upon creation.
   */
   function brandExists(
      address brandAddress
   ) internal view returns (bool) {
      AppStorage storage ds = LibAppStorage.appStorage();
      return (ds.brands[brandAddress].registrationTimestamp != 0);
   }

   
   /**
    * @dev Checks if the parent brand of a given retailer is in an active state (not Revoked).
   */
   function isParentBrandActive(
      address retailerAddress
   ) internal view returns (bool) {
      AppStorage storage ds = LibAppStorage.appStorage();
      address brandAddress = ds.retailers[retailerAddress].brandAddress;
      return ds.brands[brandAddress].status == BrandStatus.Active;
   }
   /**
    * @dev Checks if a retailer profile has been created for a given address.
    * Relies on the fact that the onboardingTimestamp is only set once upon creation.
   */
   function retailerExists(
      address retailerAddress
   ) internal view returns (bool) {
      AppStorage storage ds = LibAppStorage.appStorage();
      return (ds.retailers[retailerAddress].onboardingTimestamp != 0);
   }

   /**
    * @dev Internal function to create the hash for a verification message.
   */
   function getVerificationHash(
      uint256 tokenId,
      uint256 challenge
   ) internal pure returns (bytes32) {
      return keccak256(abi.encodePacked(tokenId, challenge));
   }
   
}