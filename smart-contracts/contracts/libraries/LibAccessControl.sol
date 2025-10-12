// contracts/libraries/LibAccessControl.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./Constants.sol";
import "./LibAppStorage.sol";

import "../storage/AppStorage.sol";

import "../interfaces/IProvenanceErrors.sol";
import "../interfaces/IProvenanceEvents.sol";


library LibAccessControl {
    
   /**
    * @notice Returns `true` if `account` has been granted `role`.
    */
   function hasRole(bytes32 role, address account) internal view returns (bool) {
      AppStorage storage ds = LibAppStorage.appStorage();
      return ds._roles[role].hasRole[account];
   }


    /**
     * @notice Internal security check used by other library functions.
     * @dev Reverts if `sender` does not have the required `role`.
     * @param role The role required for the check to pass.
     * @param sender The address of the original transaction sender (`msg.sender`).
     */
    function _checkRole(bytes32 role, address sender) internal view {
        if (!hasRole(role, sender)) {
            revert IProvenanceErrors.AccessControlUnauthorizedAccount(sender, role);
        }
    }

    /**
     * @notice Returns the admin role that controls `role`.
     */
    function getRoleAdmin(bytes32 role) internal view returns (bytes32) {
        AppStorage storage ds = LibAppStorage.appStorage();
        bytes32 adminRole = ds._roles[role].adminRole;
        return adminRole == bytes32(0) ? Constants.DEFAULT_ADMIN_ROLE : adminRole;
    }

    /**
     * @notice Grants `role` to `account`.
     * @dev The `sender` must have `role`'s admin role.
     * Emits a {RoleGranted} event.
     * @param sender The address of the original transaction sender (`msg.sender`).
     */
    function grantRole(bytes32 role, address account, address sender) internal {
        _checkRole(getRoleAdmin(role), sender);
        AppStorage storage ds = LibAppStorage.appStorage();
        if (!ds._roles[role].hasRole[account]) {
            ds._roles[role].hasRole[account] = true;
            emit IProvenanceEvents.RoleGranted(role, account, sender);
        }
    }

    /**
     * @notice Revokes `role` from `account`.
     * @dev The `sender` must have `role`'s admin role.
     * Emits a {RoleRevoked} event.
     * @param sender The address of the original transaction sender (`msg.sender`).
     */
    function revokeRole(bytes32 role, address account, address sender) internal {
        _checkRole(getRoleAdmin(role), sender);
        AppStorage storage ds = LibAppStorage.appStorage();
        if (ds._roles[role].hasRole[account]) {
            ds._roles[role].hasRole[account] = false;
            emit IProvenanceEvents.RoleRevoked(role, account, sender);
        }
    }

    /**
     * @notice Sets `adminRole` as ``role``'s admin role.
     * @dev The `sender` must have the DEFAULT_ADMIN_ROLE.
     * Emits a {RoleAdminChanged} event.
     * @param sender The address of the original transaction sender (`msg.sender`).
     */
    function setRoleAdmin(bytes32 role, bytes32 adminRole, address sender) internal {
        _checkRole(Constants.DEFAULT_ADMIN_ROLE, sender);
        AppStorage storage ds = LibAppStorage.appStorage();
        bytes32 previousAdminRole = getRoleAdmin(role);
        ds._roles[role].adminRole = adminRole;
        emit IProvenanceEvents.RoleAdminChanged(role, previousAdminRole, adminRole);
    }
}