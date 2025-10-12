// contracts/facets/ERC721Facet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibERC721.sol";

/**
 * @title ERC721Facet
 * @notice Provides the public-facing, external functions for the ERC721 standard.
 * @dev This is a thin wrapper that calls the internal logic in LibERC721.
 * It is the main entry point for users and other contracts interacting with the NFT.
 */
contract ERC721Facet {

   function balanceOf(address owner) external view returns (uint256) {
      return LibERC721.balanceOf(owner);
   }

   function ownerOf(uint256 tokenId) external view returns (address) {
      return LibERC721.ownerOf(tokenId);
   }

   function name() external view returns (string memory) {
      return LibERC721.name();
   }

   function symbol() external view returns (string memory) {
      return LibERC721.symbol();
   }
   
}