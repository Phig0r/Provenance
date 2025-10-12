// contracts/facets/BrandFacet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/Constants.sol";
import "../libraries/LibAppStorage.sol";
import "../libraries/LibProvenance.sol";
import "../libraries/LibAccessControl.sol";
import "../libraries/LibERC721.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

import "../storage/AppStorage.sol";

contract BrandFacet is IProvenanceErrors, IProvenanceEvents {

   /**
    * @notice Creates (mints) a new product NFT.
    * @dev Can only be called by an address with the BRAND_ROLE and an Active status.
    * It creates the product's on-chain data, including its unique authenticator address,
    * and mints the ERC721 token to the brand itself.
    * @param _name The official name of the product being created.
    * @param _productAuth The unique, product-specific address used for future signature verifications.
   */
   function mintProduct(
      string memory _name,
      address _productAuth
   ) external {
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }

      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.brands[msg.sender].status != BrandStatus.Active) {
         revert ProvenanceBrandNotActive(msg.sender, ds.brands[msg.sender].status);
      }
      require(_productAuth != address(0), ProvenanceZeroAddressNotAllowed());

      uint256 _currentId = ds._nextTokenId;
      ds._nextTokenId ++;

      ds.products[_currentId] = ProductNFT({
         name: _name,
         brandAddress: msg.sender, 
         productAuthenticator: _productAuth,
         mintTimestamp: block.timestamp,
         saleTimestamp:0,
         status: ProductStatus.InFactory
      });

      LibERC721.mint(msg.sender, _currentId, msg.sender);

      emit ProductMinted(msg.sender, _currentId, _name, _productAuth, block.timestamp);
   }


   /**
    * @notice Allows a brand to register a new authorized retailer.
    * @dev Can only be called by an address with the BRAND_ROLE and an Active status.
    * Creates a RetailerProfile, sets its status to Active, and grants it the RETAILER_ROLE.
    * @param _retailerAddress The wallet address of the new retailer.
    * @param _name The official name of the new retailer.
   */
   function registerRetailer(
      address _retailerAddress, 
      string memory _name
   ) external {
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.brands[msg.sender].status != BrandStatus.Active) {
         revert ProvenanceBrandNotActive(msg.sender, ds.brands[msg.sender].status);
      }
      require(_retailerAddress != address(0), ProvenanceZeroAddressNotAllowed());
      if (LibProvenance.retailerExists(_retailerAddress)) {
         revert ProvenanceRetailerAlreadyExists(_retailerAddress);
      }

      ds.retailers[_retailerAddress] = RetailerProfile({
         name: _name,
         brandAddress: msg.sender,
         onboardingTimestamp: block.timestamp,
         status: RetailerStatus.Active
      });
      LibAccessControl.grantRole(Constants.RETAILER_ROLE, _retailerAddress, msg.sender);

      emit RetailerRegistered(msg.sender, _retailerAddress,_name, block.timestamp);
   }

   /**
    * @notice Allows a brand to update the status of one of its authorized retailers.
    * @dev Can only be called by the brand that registered the retailer.
    * If the new status is 'Terminated', the retailer's role is also permanently revoked.
    * @param _retailerAddress The wallet address of the retailer to update.
    * @param _newStatus The new operational status for the retailer (Active, Suspended, or Terminated).
   */
   function updateRetailerStatus(
     address _retailerAddress, 
      RetailerStatus _newStatus
   ) external {
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.brands[msg.sender].status != BrandStatus.Active) {
      revert ProvenanceBrandNotActive(msg.sender, ds.brands[msg.sender].status);
      }
      if (!LibProvenance.retailerExists(_retailerAddress)) {
         revert ProvenanceRetailerNotFound(_retailerAddress);
      }

      RetailerProfile memory retailer = ds.retailers[_retailerAddress];
      if (retailer.brandAddress != msg.sender) {
         revert ProvenanceNotAuthorizedToManageRetailer(msg.sender, _retailerAddress);
      }
      if (retailer.status == RetailerStatus.Terminated) {
         revert ProvenanceRetailerPermanentlyTerminated(_retailerAddress);
      }

      ds.retailers[_retailerAddress].status = _newStatus;

      if(_newStatus == RetailerStatus.Terminated){
         LibAccessControl.revokeRole(Constants.RETAILER_ROLE, _retailerAddress, msg.sender);
      }

      emit RetailerStatusUpdated(_retailerAddress, _newStatus, block.timestamp);
   }

   /**
    * @notice Initiates the shipment of a batch of products to a retailer.
    * @dev Can only be called by an active brand. Verifies the recipient retailer is also active.
    * Loops through an array of tokenIds, transfers ownership of each, and updates its status to InTransit.
    * @param _tokenIds An array of token IDs to be shipped.
    * @param _retailer The address of the recipient retailer.
   */
   function initiateShipment(
      uint256[] memory _tokenIds,
      address _retailer
   ) external {
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.brands[msg.sender].status != BrandStatus.Active) {
      revert ProvenanceBrandNotActive(msg.sender, ds.brands[msg.sender].status);
      }
      if (!LibProvenance.retailerExists( _retailer)) {
         revert ProvenanceRetailerNotFound(_retailer);
      }

      RetailerProfile memory retailer = ds.retailers[_retailer];
      if (retailer.status != RetailerStatus.Active) {
         revert ProvenanceRetailerNotActive(_retailer, retailer.status);
      }

      for(uint256 i = 0; i < _tokenIds.length; i++){
         uint256 tokenId = _tokenIds[i];
         ProductStatus currentStatus = ds.products[tokenId].status;
         if (currentStatus != ProductStatus.InFactory) {
            revert ProvenanceInvalidProductStatus(tokenId, currentStatus, ProductStatus.InFactory);
         }
         LibERC721.transferFrom(msg.sender, _retailer, tokenId, msg.sender);
         ds.products[tokenId].status = ProductStatus.InTransit;
      }

      emit ShipmentInitiated(msg.sender, _retailer, _tokenIds, block.timestamp);
   }

   /**
    * @notice Allows a brand to confirm the receipt of a returned shipment.
    * @dev Can only be called by an active brand. Updates status from InTransit back to InFactory.
    * @param _tokenIds An array of token IDs that have been returned.
   */
   function confirmReturnReceipt(
      uint256[] memory _tokenIds
   ) external{
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      for (uint256 i = 0; i < _tokenIds.length; i++) {
         uint256 tokenId = _tokenIds[i];
         address productOwner = LibERC721.ownerOf(tokenId);
         if (productOwner != msg.sender) {
            revert ProvenanceNotProductOwner(msg.sender, tokenId, productOwner);
         }

         ProductStatus currentStatus = ds.products[tokenId].status;
         if (currentStatus != ProductStatus.InTransit) {
            revert ProvenanceInvalidProductStatus(tokenId, currentStatus, ProductStatus.InTransit);
         }
         
         ds.products[tokenId].status = ProductStatus.InFactory;
      }

      emit ReturnReceived(msg.sender, _tokenIds, block.timestamp);
   }

   
   /**
    * @notice Fulfills a direct-to-consumer sale, bypassing the retail channel.
    * @dev Can only be called by an active brand for a product that is currently in the factory.
    * Transfers ownership and updates the product's status to Sold.
    * @param _tokenId The ID of the token being sold directly.
    * @param _consumer The wallet address of the purchasing consumer.
   */
   function fulfillDirectOrder(
      uint256 _tokenId,
      address _consumer
   ) external {
      if(!LibAccessControl.hasRole(Constants.BRAND_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.BRAND_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.brands[msg.sender].status != BrandStatus.Active) {
         revert ProvenanceBrandNotActive(msg.sender, ds.brands[msg.sender].status);
      }

      ProductStatus currentStatus = ds.products[_tokenId].status;
      if (currentStatus != ProductStatus.InFactory) {
         revert ProvenanceInvalidProductStatus(_tokenId, currentStatus, ProductStatus.InFactory);
      }
      
      require(_consumer != address(0), ProvenanceZeroAddressNotAllowed());

      LibERC721.transferFrom(msg.sender, _consumer, _tokenId, msg.sender);
      ds.products[_tokenId].saleTimestamp = block.timestamp;
      ds.products[_tokenId].status = ProductStatus.Sold;

      emit BrandFulfilledDirectOrder(msg.sender, _consumer, _tokenId, block.timestamp);
   }

   /**
    * @notice Retrieves the profile data for a registered retailer.
    * @param _retailerAddress The address of the retailer to query.
    * @return retailerProfile A RetailerProfile struct containing the retailer's data.
    */
   function getRetailerProfile(address _retailerAddress) external view returns (RetailerProfile memory retailerProfile) {
      AppStorage storage ds = LibAppStorage.appStorage();

      if (!LibProvenance.retailerExists(_retailerAddress)) {
         revert ProvenanceRetailerNotFound(_retailerAddress);
      }

      return ds.retailers[_retailerAddress];
   }

   
}