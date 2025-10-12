// contracts/facets/AccessControlFacet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/LibAccessControl.sol";
import "../libraries/Constants.sol";

contract AccessControlFacet {

    /**
     * @notice Returns `true` if `account` has been granted `role`.
     */
    function hasRole(bytes32 role, address account) external view returns (bool) {
        return LibAccessControl.hasRole(role, account);
    }

    /**
     * @notice Returns the admin role that controls `role`.
     */
    function getRoleAdmin(bytes32 role) external view returns (bytes32) {
        return LibAccessControl.getRoleAdmin(role);
    }

    /**
     * @notice Grants a `role` to an `account`.
     * @dev The caller (`msg.sender`) must have the admin role for the `role` being granted. This function
     * is a public-facing wrapper that securely delegates its logic to the internal `LibAccessControl` library.
     * @param role The bytes32 identifier for the role to be granted.
     * @param account The address of the account to receive the role.
     */
    function grantRole(bytes32 role, address account) external {
        if(!LibAccessControl.hasRole(Constants.DEFAULT_ADMIN_ROLE, msg.sender)){
            revert("Provenance: Unauthorized accesss");
        }

        LibAccessControl.grantRole(role, account, msg.sender);
    }

    /**
     * @notice Revokes a `role` from an `account`.
     * @dev The caller (`msg.sender`) must have the admin role for the `role` being revoked. This function
     * is a public-facing wrapper that securely delegates its logic to the internal `LibAccessControl` library.
     * @param role The bytes32 identifier for the role to be revoked.
     * @param account The address of the account from which to revoke the role.
     */
    function revokeRole(bytes32 role, address account) external {
        LibAccessControl.revokeRole(role, account, msg.sender);
    }

}