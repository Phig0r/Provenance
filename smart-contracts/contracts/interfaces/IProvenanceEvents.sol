// contracts/interfaces/IProvenanceEvents.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../storage/AppStorage.sol";
import "../storage/DiamondStorage.sol";

interface IProvenanceEvents {
   /**
    * @notice Emitted when a new brand is successfully registered by an admin.
    * @param brandAddress The address of the newly registered brand.
    * @param name The official name of the brand.
    * @param timestamp The time of the registration.
   */
   event BrandRegistered(
      address indexed brandAddress,
      string name,
      uint256 timestamp
   );

   /**
    * @notice Emitted when an admin updates a brand's operational status.
    * @param brandAddress The address of the brand being updated.
    * @param status The new status of the brand.
    * @param timestamp The time of the status update.
   */
   event BrandStatusUpdated(
      address indexed brandAddress,
      BrandStatus status,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand successfully mints a new product NFT.
    * @param brand The address of the brand that minted the product.
    * @param tokenId The unique ID of the newly minted token.
    * @param name The official name of the product.
    * @param productAuthenticator The unique address for the product's signature verification.
    * @param timestamp The time the product was minted.
   */
   event ProductMinted(
      address indexed brand,
      uint256 indexed tokenId,
      string name,
      address productAuthenticator,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand registers a new retailer.
    * @param brand The address of the brand registering the retailer.
    * @param retailer The address of the newly registered retailer.
    * @param name The name of the newly registered retailer.
    * @param timestamp The time of the registration.
   */
   event RetailerRegistered(
      address indexed brand,
      address indexed retailer,
      string name,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand updates a retailer's operational status.
    * @param retailer The address of the retailer being updated.
    * @param status The new status of the retailer.
    * @param timestamp The time of the status update.
   */
   event RetailerStatusUpdated(
      address indexed retailer,
      RetailerStatus status,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand sells a product directly to a consumer.
    * @param brand The address of the brand that sold the product.
    * @param consumer The address of the consumer who purchased the product.
    * @param tokenId The ID of the product that was sold.
    * @param timestamp The time of the direct sale.
   */
   event BrandFulfilledDirectOrder(
      address indexed brand,
      address indexed consumer,
      uint256 indexed tokenId,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand ships a batch of products to a retailer.
    * @param brand The address of the brand sending the shipment.
    * @param retailer The address of the retailer receiving the shipment.
    * @param tokenIds The array of product token IDs in the shipment.
   */
   event ShipmentInitiated(
      address indexed brand,
      address indexed retailer,
      uint256[] tokenIds,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a brand confirms the receipt of a returned shipment.
    * @param brand The address of the brand that received the return.
    * @param tokenIds The array of product token IDs that were returned.
    * @param timestamp The time the return was confirmed.
   */   
   event ReturnReceived(
      address indexed brand ,
      uint256[] tokenIds,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a retailer confirms they have received a shipment.
    * @param retailer The address of the retailer that received the shipment.
    * @param tokenIds The array of product token IDs that were received.
    * @param timestamp The time the shipment was confirmed as received.
   */
   event ShipmentReceived(
      address indexed retailer,
      uint256[] tokenIds,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a retailer initiates the return of a shipment to the brand.
    * @param retailer The address of the retailer initiating the return.
    * @param brand The address of the brand receiving the return.
    * @param tokenIds The array of product token IDs being returned.
    * @param timestamp The time the return was initiated.
   */
   event ShipmentReturned(
      address indexed retailer,
      address indexed brand,
      uint256[] tokenIds,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a retailer finalizes a sale to a consumer.
    * @param consumer The address of the consumer who purchased the product.
    * @param retailer The address of the retailer that sold the product.
    * @param tokenId The ID of the product that was sold.
    * @param timestamp The time of the final sale.
   */
   event ProductSold(
      address indexed consumer,
      address indexed retailer,
      uint256 indexed tokenId,
      uint256 timestamp
   );

   /**
    * @notice Emitted when a product's authenticity is successfully verified on-chain.
    * @dev This event signals that a specific challenge has been consumed for a tokenId.
    * @param tokenId The ID of the product that was verified.
    * @param challenge The unique, one-time nonce that was used for the verification.
   */
   event ProductVerified(
      uint256 indexed tokenId, 
      uint256 challenge
   );

   // --- erc721 ---
      /**
    * @dev Emitted when `tokenId` token is transferred from `from` to `to`.
    */
   event Transfer(
      address indexed from,
      address indexed to,
      uint256 indexed tokenId
   );

   /**
    * @dev Emitted when `owner` enables `approved` to manage the `tokenId` token.
    */
   event Approval(
      address indexed owner,
      address indexed approved,
      uint256 indexed tokenId
   );

   /**
    * @dev Emitted when `owner` enables or disables (`approved`) `operator` to manage all of its assets.
    */
   event ApprovalForAll(
      address indexed owner,
      address indexed operator,
      bool approved
   );

   // --- Access Control ---
   /**
    * @dev Emitted when `account` is granted `role`.
    *
    * `sender` is the account that originated the contract call. This account bears the admin role (for the granted role).
    * Expected in cases where the role was granted using the internal {AccessControl-_grantRole}.
    */
   event RoleGranted(
      bytes32 indexed role,
      address indexed account,
      address indexed sender
   );

   /**
    * @dev Emitted when `account` is revoked `role`.
    *
    * `sender` is the account that originated the contract call:
    *   - if using `revokeRole`, it is the admin role bearer
    *   - if using `renounceRole`, it is the role bearer (i.e. `account`)
    */
   event RoleRevoked(
      bytes32 indexed role,
      address indexed account,
      address indexed sender
   );

   /**
    * @dev Emitted when `newAdminRole` is set as ``role``'s admin role, replacing `previousAdminRole`
    *
    * `DEFAULT_ADMIN_ROLE` is the starting admin for all roles, despite
    * {RoleAdminChanged} not being emitted to signal this.
    */
   event RoleAdminChanged(
      bytes32 indexed role,
      bytes32 indexed previousAdminRole,
      bytes32 indexed newAdminRole
   );

   // --- Diamond ---
   /**
    * @dev Emitted when the Diamond's routing table is updated.
    */
   event DiamondCut(FacetCut[] _diamondCut, address _init, bytes _calldata);
}
