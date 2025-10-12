// contracts/interfaces/IProvenanceErrors.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../storage/AppStorage.sol";

interface IProvenanceErrors {
   // --- General Errors ---

   /**
    * @notice The provided address is the zero address, which is not allowed.
    */
   error ProvenanceZeroAddressNotAllowed();

   // --- Brand Errors ---

   /**
    * @notice A brand with the provided address has already been registered.
    * @param brandAddress The address that was submitted.
   */
   error ProvenanceBrandAlreadyExists(address brandAddress);

   /**
    * @notice No brand is registered with the provided address.
    * @param brandAddress The address that was queried.
   */
   error ProvenanceBrandNotFound(address brandAddress);

   /**
    * @notice The calling brand is not in an 'Active' state and cannot perform this action.
    * @param brandAddress The address of the brand attempting the action.
    * @param currentStatus The brand's current, non-active status.
   */
   error ProvenanceBrandNotActive(address brandAddress, BrandStatus currentStatus);

   /**
    * @notice The specified brand has been permanently revoked and cannot be modified.
    * @param brandAddress The address of the revoked brand.
   */
   error ProvenanceBrandPermanentlyRevoked(address brandAddress);

   // --- Retailer Errors ---

   /**
    * @notice A retailer with the provided address has already been registered.
    * @param retailerAddress The address that was submitted.
   */
   error ProvenanceRetailerAlreadyExists(address retailerAddress);

   /**
    * @notice No retailer is registered with the provided address.
    * @param retailerAddress The address that was queried.
   */
   error ProvenanceRetailerNotFound(address retailerAddress);

   /**
    * @notice The target retailer is not in an 'Active' state.
    * @param retailerAddress The address of the retailer.
    * @param currentStatus The retailer's current, non-active status.
   */
   error ProvenanceRetailerNotActive(address retailerAddress, RetailerStatus currentStatus);

   /**
    * @notice The specified retailer has been permanently terminated and cannot be modified.
    * @param retailerAddress The address of the terminated retailer.
   */
   error ProvenanceRetailerPermanentlyTerminated(address retailerAddress);

   /**
    * @notice The caller is not the brand that registered this retailer.
    * @param caller The address of the unauthorized brand.
    * @param retailerAddress The address of the retailer they tried to manage.
   */
   error ProvenanceNotAuthorizedToManageRetailer(address caller, address retailerAddress);

   /**
    * @notice The parent brand associated with the retailer is not in an 'Active' state.
    * @param retailerAddress The address of the retailer whose parent brand is not active.
    * @param brandAddress The address of the non-active parent brand.
   */
   error ProvenanceParentBrandNotActive(address retailerAddress, address brandAddress);

   // --- Product & Verification Errors ---

   /**
    * @notice The provided signature is invalid as it was not created by the product's registered authenticator.
    * @param tokenId The ID of the product.
    * @param recoveredSigner The address that was recovered from the signature.
    * @param expectedAuthenticator The address that was expected to sign.
   */
   error ProvenanceInvalidSignature(uint256 tokenId, address recoveredSigner, address expectedAuthenticator);

   /**
    * @notice The provided signature was malformed, and a signer address could not be recovered.
    * @param tokenId The ID of the product for which the recovery failed.
   */
   error ProvenanceInvalidSignatureRecovery(uint256 tokenId);

   /**
    * @notice No product exists with the provided token ID.
    * @param tokenId The token ID that was queried.
    */
   error ProvenanceProductNotFound(uint256 tokenId);

   /**
    * @notice The caller is not the owner of the specified product NFT.
    * @param caller The address of the account that made the call.
    * @param tokenId The ID of the product they attempted to access.
    * @param owner The address of the actual token owner.
    */
   error ProvenanceNotProductOwner(address caller, uint256 tokenId, address owner);

   /**
    * @notice A product is not in the required state to perform an action.
    * @param tokenId The ID of the product.
    * @param currentStatus The product's actual current status.
    * @param requiredStatus The status the product needed to be in for the action.
    */
   error ProvenanceInvalidProductStatus(uint256 tokenId, ProductStatus currentStatus, ProductStatus requiredStatus);

   /**
    * @notice The provided challenge (nonce) has already been consumed for this token.
    * @param tokenId The ID of the product for which the nonce was reused.
    * @param challenge The nonce that was reused.
    */
   error ProvenanceNonceAlreadyUsed(uint256 tokenId, uint256 challenge);

   // --- ERC721 ---
      
   /**
    * @dev Indicates a `tokenId` whose `owner` is the zero address.
    * @param tokenId Identifier number of a token.
    */
   error ERC721NonexistentToken(uint256 tokenId);

   /**
    * @dev Indicates that an address can't be an owner. For example, `address(0)` is a forbidden owner in ERC-20.
    * Used in balance queries.
    * @param owner Address of the current owner of a token.
    */
   error ERC721InvalidOwner(address owner);

   /**
    * @dev Indicates an error related to the ownership over a particular token. Used in transfers.
    * @param sender Address whose tokens are being transferred.
    * @param tokenId Identifier number of a token.
    * @param owner Address of the current owner of a token.
    */
   error ERC721IncorrectOwner(address sender, uint256 tokenId, address owner);

   /**
    * @dev Indicates a failure with the token `sender`. Used in transfers.
    * @param sender Address whose tokens are being transferred.
    */
   error ERC721InvalidSender(address sender);

   /**
    * @dev Indicates a failure with the token `receiver`. Used in transfers.
    * @param receiver Address to which tokens are being transferred.
    */
   error ERC721InvalidReceiver(address receiver);

   /**
    * @dev Indicates a failure with the `operator`’s approval. Used in transfers.
    * @param operator Address that may be allowed to operate on tokens without being their owner.
    * @param tokenId Identifier number of a token.
    */
   error ERC721InsufficientApproval(address operator, uint256 tokenId);

   /**
    * @dev Indicates a failure with the `approver` of a token to be approved. Used in approvals.
    * @param approver Address initiating an approval operation.
    */
   error ERC721InvalidApprover(address approver);

   /**
    * @dev Indicates a failure with the `operator` to be approved. Used in approvals.
    * @param operator Address that may be allowed to operate on tokens without being their owner.
    */
   error ERC721InvalidOperator(address operator);

   //--- Access Control ---
   
   /**
    * @dev The `account` is missing a role.
    */
   error AccessControlUnauthorizedAccount(address account, bytes32 neededRole);

}
