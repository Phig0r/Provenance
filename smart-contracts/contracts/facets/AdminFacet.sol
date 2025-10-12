// contracts/facets/AdminFacet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/Constants.sol";
import "../libraries/LibProvenance.sol";
import "../libraries/LibAccessControl.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

contract AdminFacet is IProvenanceErrors, IProvenanceEvents {

   /**
    * @notice Onboards a new brand onto the platform.
    * @dev Can only be called by an admin. Creates a BrandProfile with a Pending status and grants the BRAND_ROLE.
    * @param _brandAddress The wallet address of the new brand.
    * @param _name The official name of the brand.
    * @param _website The official website of the brand.
   */
   function registerBrand(
      address _brandAddress, 
      string memory _name, 
      string memory _website
   ) external {
      if(!LibAccessControl.hasRole(Constants.ADMIN_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.ADMIN_ROLE);
      }

   
      AppStorage storage ds = LibAppStorage.appStorage();
      require(_brandAddress != address(0), ProvenanceZeroAddressNotAllowed());
      require(!LibProvenance.brandExists(_brandAddress), ProvenanceBrandAlreadyExists(_brandAddress));
      
      ds.brands[_brandAddress] = BrandProfile({
         brandAddress: _brandAddress,
         name: _name,
         website: _website,
         registrationTimestamp: block.timestamp,
         status: BrandStatus.Pending
      });
      
      LibAccessControl.grantRole(Constants.BRAND_ROLE, _brandAddress, msg.sender);
      
      emit BrandRegistered(_brandAddress, _name, block.timestamp);
   }

   /**
    * @notice Updates the operational status of a registered brand.
    * @dev Can only be called by an admin. Used to activate, suspend, or revoke a brand.
    * @param _brandAddress The address of the brand to update.
    * @param _newStatus The new status for the brand.
   */
   function updateBrandStatus(
      address _brandAddress, 
      BrandStatus _newStatus
   ) external {
      if(!LibAccessControl.hasRole(Constants.ADMIN_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.ADMIN_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (!LibProvenance.brandExists( _brandAddress)) {
         revert ProvenanceBrandNotFound(_brandAddress);
      }
      if (ds.brands[_brandAddress].status == BrandStatus.Revoked) {
         revert ProvenanceBrandPermanentlyRevoked(_brandAddress);
      }

      ds.brands[_brandAddress].status = _newStatus;
      if(_newStatus == BrandStatus.Revoked){
         LibAccessControl.revokeRole(Constants.BRAND_ROLE, _brandAddress, msg.sender);
      }
     
      emit BrandStatusUpdated(_brandAddress, _newStatus, block.timestamp);
   }
   
   /**
     * @notice Retrieves the profile data for a registered brand.
     * @dev Public read-only function to allow external applications to view brand data.
     * @param _brandAddress The address of the brand to query.
     * @return brandProfile A BrandProfile struct containing the brand's on-chain data.
     */
   function getBrandProfile(
      address _brandAddress
   ) external view returns (BrandProfile memory brandProfile) {
      AppStorage storage ds = LibAppStorage.appStorage();

      if (!LibProvenance.brandExists(_brandAddress)) {
         revert ProvenanceBrandNotFound(_brandAddress);
      }

      return ds.brands[_brandAddress];
   }
}