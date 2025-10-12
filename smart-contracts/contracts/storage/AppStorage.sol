// contracts/storage/AppStorage.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// --- Provenance ---
enum BrandStatus {Pending, Active, Suspended, Revoked}
struct BrandProfile {
   address brandAddress;
   string name;
   string website;
   uint256 registrationTimestamp;
   BrandStatus status;
}

enum RetailerStatus {Active, Suspended, Terminated}
struct RetailerProfile {
   string name;
   address brandAddress;
   uint256 onboardingTimestamp;
   RetailerStatus status;
}

enum ProductStatus {InFactory, InTransit, InRetailer, Sold}
struct ProductNFT {
   string name;
   address brandAddress;
   address productAuthenticator;
   uint256 mintTimestamp;
   uint256 saleTimestamp;
   ProductStatus status;
}

//--- Access Control ---
struct RoleData {
   mapping(address account => bool) hasRole;
   bytes32 adminRole;
}

struct AppStorage {
   mapping(address => BrandProfile)  brands;
   mapping(address => RetailerProfile) retailers;
   mapping(uint256 => ProductNFT) products;
   mapping (uint256 tokenId => mapping (uint256 nonce => bool)) isNonceUsed;

   uint256 _nextTokenId;

   // ERC721
   string _name;
   string _symbol;
   mapping(uint256 => address) _owners;
   mapping(address => uint256) _balances;
   mapping(uint256 => address) _tokenApprovals;
   mapping(address owner => mapping(address operator => bool)) _operatorApprovals;
   
   //Access Control
   mapping(bytes32 role => RoleData) _roles;
   
}
