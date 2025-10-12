// contracts/facets/ConsumerFacet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/cryptography/MessageHashUtils.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

import "../libraries/LibProvenance.sol";
import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

contract ConsumerFacet is IProvenanceErrors, IProvenanceEvents {

   /**
    * @dev Enables OpenZeppelin's cryptographic helpers to be called as methods on `bytes32` variables,
    * allowing for syntax like `myHash.toEthSignedMessageHash()`.
   */
   using MessageHashUtils for bytes32;
   using ECDSA for bytes32;

   /**
    * @notice Confirms a product's authenticity by verifying a signature from its physical authenticator (PUF).
    * @dev Verifies that the `_signature` for a `_tokenId` and `_challenge` was created by the product's
    * registered authenticator. Consumes the challenge as a nonce to prevent replay attacks.
    * Emits a `ProductVerified` event on success.
    * @param _tokenId The unique ID of the product being verified.
    * @param _challenge The unique, one-time number provided to the PUF to generate the signature.
    * @param _signature The cryptographic signature produced by the PUF.
   */
   function consumeVerification(
      uint256 _tokenId,
      uint256 _challenge,
      bytes memory _signature
   ) external {
      if (isNonceAlreadyUsed(_tokenId, _challenge)) {
         revert ProvenanceNonceAlreadyUsed(_tokenId, _challenge);
      }
      AppStorage storage ds = LibAppStorage.appStorage();

      bytes32 messageHash = LibProvenance.getVerificationHash(_tokenId, _challenge);
      
      address signer = messageHash.toEthSignedMessageHash().recover(_signature);
      
      if (signer == address(0)) {
         revert ProvenanceInvalidSignatureRecovery(_tokenId);
      }

      address officialAuthenticator = ds.products[_tokenId].productAuthenticator;
      if (signer != officialAuthenticator) {
         revert ProvenanceInvalidSignature( _tokenId, signer, officialAuthenticator);
      }

      ds.isNonceUsed[_tokenId][_challenge] = true;
      
      emit ProductVerified(_tokenId, _challenge);
   }

   /**
    * @notice Returns the on-chain data for a specific product.
    * @param _tokenId The ID of the token to query.
    * @return A ProductNFT struct containing the product's metadata.
    */
   function getProductDetails(
      uint256 _tokenId
   ) external view returns (ProductNFT memory) {
      AppStorage storage ds = LibAppStorage.appStorage();
      if (ds.products[_tokenId].mintTimestamp == 0) {
         revert ProvenanceProductNotFound(_tokenId);
      }
      return ds.products[_tokenId];
   }

   /** 
    * @notice Checks if a specific nonce has already been used for a given token ID.
    * @dev Public read-only function to allow off-chain applications to pre-check a nonce's validity before sending a state-changing transaction.
    * @param _tokenId The ID of the token to check.
    * @param _nonce The nonce to check.
    * @return True if the nonce has already been used, false otherwise.
   */
   function isNonceAlreadyUsed(
      uint256 _tokenId, 
      uint256 _nonce
   ) public view returns (bool){
      AppStorage storage ds = LibAppStorage.appStorage();
      return ds.isNonceUsed[_tokenId][_nonce];
   }
}