// contracts/libraries/LibDiamond.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../storage/DiamondStorage.sol";
import "../interfaces/IProvenanceEvents.sol";

library LibDiamond {

   /**
     * @dev Returns the storage pointer for the Diamond's internal state (owner and facet mappings).
     * It uses a specific, standardized storage slot to avoid collisions with application state.
     * @return ds The storage pointer for `DiamondStorage`.
     */
   function diamondStorage() internal pure returns (DiamondStorage storage ds) {
      bytes32 position = keccak256("diamond.standard.diamond.storage");
      assembly {
         ds.slot := position
      }
   }

   /**
     * @dev Sets the contract owner's address in the diamond's storage.
     * @param _owner The address of the new contract owner.
     */
   function setOwner(address _owner) internal {
      DiamondStorage storage ds = diamondStorage();
      ds.contractOwner = _owner;
   }

   /**
     * @dev Retrieves the current contract owner's address from diamond storage.
     * @return owner_ The address of the current owner.
     */
   function owner() internal view returns (address owner_) {
      owner_ = diamondStorage().contractOwner;
   }

   /**
     * @dev An internal security check that reverts the transaction if `msg.sender` is not the contract owner.
     * This functions as an access control modifier for owner-only functions.
     */
   function enforceIsOwner() internal view {
      require(msg.sender == owner(), "LibDiamond: Must be contract owner");
   }

   /**
     * @notice Adds, replaces, or removes functions in the Diamond.
     * @dev The core logic for modifying the Diamond's function-to-facet mapping. It iterates through
     * the `FacetCut` instructions and can optionally execute an initializer contract via `delegatecall`.
     * @param _diamondCut An array of `FacetCut` structs detailing the upgrade actions.
     * @param _init The address of a contract to call for initialization after the cut. Use address(0) if none.
     * @param _calldata The function call data to send to the `_init` contract. Use empty bytes if none.
     */
   function diamondCut(
      FacetCut[] memory _diamondCut,
      address _init,
      bytes memory _calldata
   ) internal {
      DiamondStorage storage ds = diamondStorage();
      for (uint256 i = 0; i < _diamondCut.length; i++) {
         FacetCutAction action = _diamondCut[i].action;
         address facetAddress = _diamondCut[i].facetAddress;
         bytes4[] memory selectors = _diamondCut[i].functionSelectors;

         if (action == FacetCutAction.Add) {
               for (uint256 j = 0; j < selectors.length; j++) {
                  bytes4 selector = selectors[j];
                  require(ds.selectorToFacetAddress[selector] == address(0), "LibDiamond: Function already exists");
                  ds.selectorToFacetAddress[selector] = facetAddress;
               }
         } else if (action == FacetCutAction.Replace) {
               for (uint256 j = 0; j < selectors.length; j++) {
                  bytes4 selector = selectors[j];
                  require(ds.selectorToFacetAddress[selector] != address(0), "LibDiamond: Function does not exist");
                  ds.selectorToFacetAddress[selector] = facetAddress;
               }
         } else if (action == FacetCutAction.Remove) {
               for (uint256 j = 0; j < selectors.length; j++) {
                  bytes4 selector = selectors[j];
                  require(ds.selectorToFacetAddress[selector] != address(0), "LibDiamond: Function does not exist");
                  delete ds.selectorToFacetAddress[selector];
               }
         }
      }
      emit IProvenanceEvents.DiamondCut(_diamondCut, _init, _calldata);

      if (_init != address(0)) {
         (bool success, ) = _init.delegatecall(_calldata);
         require(success, "LibDiamond: DiamondInit failed");
      }
   }
}