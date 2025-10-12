// contracts/libraries/LibERC721.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./LibAppStorage.sol";
import "./Constants.sol";
import "./LibAccessControl.sol";

import "../storage/AppStorage.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";

library LibERC721 {

    /**
     * @dev See {IERC721-balanceOf}. Returns the number of tokens owned by an account.
     * @param owner The address to query the balance for.
     * @return The number of tokens owned by the `owner`.
     */
    function balanceOf(address owner) internal view returns (uint256) {
        AppStorage storage ds = LibAppStorage.appStorage();
        if (owner == address(0)) {
            revert IProvenanceErrors.ERC721InvalidOwner(address(0));
        }
        return ds._balances[owner];
    }

    /**
     * @dev See {IERC721-ownerOf}. Returns the owner of a given token.
     * Reverts if the token does not exist.
     * @param tokenId The identifier for the token to query.
     * @return The address of the token's owner.
     */
    function ownerOf(uint256 tokenId) internal view returns (address) {
        return _requireOwned(tokenId);
    }

    /**
     * @dev See {IERC721Metadata-name}. Returns the name of the token collection.
     */
    function name() internal view returns (string memory) {
        AppStorage storage ds = LibAppStorage.appStorage();
        return ds._name;
    }

    /**
     * @dev See {IERC721Metadata-symbol}. Returns the symbol of the token collection.
     */
    function symbol() internal view returns (string memory) {
        AppStorage storage ds = LibAppStorage.appStorage();
        return ds._symbol;
    }

    /**
     * @dev See {IERC721-getApproved}. Returns the approved address for a single token.
     * Reverts if the token does not exist.
     * @param tokenId The identifier for the token.
     * @return The approved address for the token, or the zero address if none is set.
     */
    function getApproved(uint256 tokenId) internal view returns (address) {
        _requireOwned(tokenId);
        return _getApproved(tokenId);
    }

    /**
     * @dev See {IERC721-isApprovedForAll}. Checks if an operator is approved by a given owner.
     * @param owner The address that owns the tokens.
     * @param operator The address that is the potential operator.
     * @return True if the `operator` is approved to manage the `owner`'s tokens.
     */
    function isApprovedForAll(address owner, address operator) internal view returns (bool) {
        AppStorage storage ds = LibAppStorage.appStorage();
        return ds._operatorApprovals[owner][operator];
    }

    /**
     * @dev Internal logic to transfer a token's ownership. Called by facets.
     * This function ensures the sender is authorized before initiating the transfer.
     * @param from The current owner of the token.
     * @param to The new owner of the token.
     * @param tokenId The identifier of the token to be transferred.
     * @param sender The original `msg.sender` of the transaction, used for authorization.
     */
    function transferFrom(address from, address to, uint256 tokenId, address sender) internal {
        if (to == address(0)) {
            revert IProvenanceErrors.ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, sender);
        if (previousOwner != from) {
            revert IProvenanceErrors.ERC721IncorrectOwner(from, tokenId, previousOwner);
        }
    }
    
    /**
     * @dev Internal logic to create a new token and assign it to an owner.
     * Enforces that the `sender` must have the `BRAND_ROLE`.
     * @param to The address that will receive the newly minted token.
     * @param tokenId The identifier of the new token.
     * @param sender The original `msg.sender` of the transaction, used for authorization.
     */
    function mint(address to, uint256 tokenId, address sender) internal {
        if (!LibAccessControl.hasRole(Constants.BRAND_ROLE, sender)) {
            revert IProvenanceErrors.AccessControlUnauthorizedAccount(sender, Constants.BRAND_ROLE);
        }

        if (to == address(0)) {
            revert IProvenanceErrors.ERC721InvalidReceiver(address(0));
        }
        address previousOwner = _update(to, tokenId, address(0)); 
        if (previousOwner != address(0)) {
            revert IProvenanceErrors.ERC721InvalidSender(address(0));
        }
    }

    /**
     * @dev Raw internal function to get the owner of a token. Does not revert if the token doesn't exist.
     * @param tokenId The identifier of the token.
     * @return The owner's address, or the zero address if the token is not minted.
     */
    function _ownerOf(uint256 tokenId) internal view returns (address) {
        AppStorage storage ds = LibAppStorage.appStorage();
        return ds._owners[tokenId];
    }

    /**
     * @dev Raw internal function to get the approved address for a token.
     * @param tokenId The identifier of the token.
     * @return The approved address, or the zero address if none is set.
     */
    function _getApproved(uint256 tokenId) internal view returns (address) {
        AppStorage storage ds = LibAppStorage.appStorage();
        return ds._tokenApprovals[tokenId];
    }

    /**
     * @dev Internal helper to check if a `spender` is authorized to manage a token.
     * @param owner The owner of the token.
     * @param spender The address to check for authorization.
     * @param tokenId The identifier of the token.
     * @return True if the spender is authorized.
     */
    function _isAuthorized(address owner, address spender, uint256 tokenId) internal view returns (bool) {
        return spender != address(0) &&
            (owner == spender || isApprovedForAll(owner, spender) || _getApproved(tokenId) == spender);
    }

    /**
     * @dev Internal helper that reverts if a `spender` is not authorized to manage a `tokenId`.
     * @param owner The owner of the token.
     * @param spender The address to check for authorization.
     * @param tokenId The identifier of the token.
     */
    function _checkAuthorized(address owner, address spender, uint256 tokenId) internal view {
        if (!_isAuthorized(owner, spender, tokenId)) {
            if (owner == address(0)) {
                revert IProvenanceErrors.ERC721NonexistentToken(tokenId);
            } else {
                revert IProvenanceErrors.ERC721InsufficientApproval(spender, tokenId);
            }
        }
    }

    /**
     * @dev The core low-level function for all token state changes (mint, transfer, burn).
     * It handles balance updates, ownership changes, and clearing approvals.
     * @param to The new owner of the token. Use `address(0)` for burns.
     * @param tokenId The identifier of the token being updated.
     * @param auth The address to check for authorization. If `address(0)`, the check is skipped.
     * @return The address of the previous owner.
     */
    function _update(address to, uint256 tokenId, address auth) internal returns (address) {
        AppStorage storage ds = LibAppStorage.appStorage();
        address from = _ownerOf(tokenId);

        if (auth != address(0)) {
            _checkAuthorized(from, auth, tokenId);
        }

        if (from != address(0)) {
            _approve(address(0), tokenId, address(0), false);
            unchecked {
                ds._balances[from] -= 1;
            }
        }

        if (to != address(0)) {
            unchecked {
                ds._balances[to] += 1;
            }
        }

        ds._owners[tokenId] = to;

        emit IProvenanceEvents.Transfer(from, to, tokenId);
        return from;
    }

    /**
     * @dev Low-level internal function to set the approval for a token.
     * @param to The address to approve.
     * @param tokenId The identifier of the token.
     * @param auth The address to check for authorization.
     * @param emitEvent A boolean to indicate whether to emit an `Approval` event.
     */
    function _approve(address to, uint256 tokenId, address auth, bool emitEvent) internal {
        AppStorage storage ds = LibAppStorage.appStorage();
        if (emitEvent || auth != address(0)) {
            address owner = _requireOwned(tokenId);
            if (auth != address(0) && owner != auth && !isApprovedForAll(owner, auth)) {
                revert IProvenanceErrors.ERC721InvalidApprover(auth);
            }

            if (emitEvent) {
                emit IProvenanceEvents.Approval(owner, to, tokenId);
            }
        }

        ds._tokenApprovals[tokenId] = to;
    }

    /**
     * @dev Internal helper that reverts if a token does not have an owner (i.e., has not been minted).
     * @param tokenId The identifier of the token to check.
     * @return The address of the token's owner.
     */
    function _requireOwned(uint256 tokenId) internal view returns (address) {
        address owner = _ownerOf(tokenId);
        if (owner == address(0)) {
            revert IProvenanceErrors.ERC721NonexistentToken(tokenId);
        }
        return owner;
    }
}