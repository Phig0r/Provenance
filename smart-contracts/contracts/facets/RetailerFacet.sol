// contracts/facets/RetailerFacet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibProvenance.sol";
import "../libraries/LibAccessControl.sol";
import "../libraries/LibERC721.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

import "../libraries/Constants.sol";

contract RetailerFacet is IProvenanceErrors, IProvenanceEvents {

   /**
    * @notice Allows a retailer to confirm the receipt of a shipment of products.
    * @dev Can only be called by an active retailer. It loops through an array of tokenIds,
    * verifying that the caller is the owner and the status is InTransit for each,
    * before updating the status to InRetailer.
    * @param _tokenIds An array of token IDs that have been physically received.
   */
   function receiveProductShipment(
      uint256[] memory _tokenIds
   ) external  {
      if(!LibAccessControl.hasRole(Constants.RETAILER_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.RETAILER_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (!LibProvenance.isParentBrandActive(msg.sender)) {
         revert ProvenanceParentBrandNotActive(msg.sender, ds.retailers[msg.sender].brandAddress);
      }
      if (ds.retailers[msg.sender].status != RetailerStatus.Active) {
         revert ProvenanceRetailerNotActive(msg.sender, ds.retailers[msg.sender].status);
      }

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
      
         ds.products[tokenId].status = ProductStatus.InRetailer;
      }

      emit ShipmentReceived(msg.sender, _tokenIds, block.timestamp);
   }

   /**
    * @notice Allows a retailer to return a batch of unsold products to their parent brand.
    * @dev Can only be called by an active retailer. Transfers ownership back to the brand and sets status to InTransit.
    * @param _tokenIds An array of token IDs to be returned.
   */
   function returnProducts(
      uint256[] memory _tokenIds
   ) external  {
      if(!LibAccessControl.hasRole(Constants.RETAILER_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.RETAILER_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      address brandAddr = ds.retailers[msg.sender].brandAddress;

      for(uint256 i = 0; i < _tokenIds.length; i++){
         uint256 tokenId = _tokenIds[i];
         ProductStatus currentStatus = ds.products[tokenId].status;
         if (currentStatus != ProductStatus.InRetailer) {
            revert ProvenanceInvalidProductStatus(tokenId, currentStatus, ProductStatus.InRetailer);
         }
         LibERC721.transferFrom(msg.sender, brandAddr, tokenId, msg.sender);
         ds.products[tokenId].status = ProductStatus.InTransit;
      }

      emit ShipmentReturned(msg.sender, brandAddr, _tokenIds, block.timestamp);
   }

   /**
    * @notice Finalizes the sale of a single product to a consumer.
    * @dev Can only be called by an active retailer who is the current owner of the product.
    * Transfers ownership to the consumer and updates the product's status to Sold.
    * @param _tokenId The ID of the token being sold.
    * @param _consumer The wallet address of the purchasing consumer.
   */
   function finalizeSale(
      uint256 _tokenId,
      address _consumer
   ) external {
      if(!LibAccessControl.hasRole(Constants.RETAILER_ROLE, msg.sender)){
         revert AccessControlUnauthorizedAccount(msg.sender,Constants.RETAILER_ROLE);
      }
      AppStorage storage ds = LibAppStorage.appStorage();
      if (!LibProvenance.isParentBrandActive(msg.sender)) {
        revert ProvenanceParentBrandNotActive(msg.sender, ds.retailers[msg.sender].brandAddress);
      }
      if (ds.retailers[msg.sender].status != RetailerStatus.Active) {
         revert ProvenanceRetailerNotActive(msg.sender, ds.retailers[msg.sender].status);
      }

      address productOwner = LibERC721.ownerOf(_tokenId);
      if (productOwner != msg.sender) {
         revert ProvenanceNotProductOwner(msg.sender, _tokenId, productOwner);
      }

      ProductStatus currentStatus = ds.products[_tokenId].status;
      if (currentStatus != ProductStatus.InRetailer) {
         revert ProvenanceInvalidProductStatus(_tokenId, currentStatus, ProductStatus.InRetailer);
      }
      
      require(_consumer != address(0), ProvenanceZeroAddressNotAllowed());

      LibERC721.transferFrom(msg.sender, _consumer, _tokenId, msg.sender);
      ds.products[_tokenId].status = ProductStatus.Sold;
      ds.products[_tokenId].saleTimestamp = block.timestamp;

      emit ProductSold(_consumer, msg.sender, _tokenId, block.timestamp);
   }
   
}