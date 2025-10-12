// contracts/utils/DemoRoleFaucet.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../libraries/Constants.sol";

interface IAccessControl {
   function grantRole(bytes32 role, address account) external;
   function revokeRole(bytes32 role, address account) external;
   function hasRole(bytes32 role, address account) external view returns (bool);
}

/**
 * @title DemoRoleFaucet
 * @dev This is a helper contract for demonstration purposes ONLY.
 * It allows any user to grant themselves roles on the main Provenance contract.
 * For this to work, this Faucet's address must be granted the DEFAULT_ADMIN_ROLE
 * on the main Provenance contract.
*/
contract DemoRoleFaucet {

   IAccessControl public provenanceDiamond;

   /**
    * @dev Sets the address of the main Provenance Diamond contract.
    * @param _diamondAddress The deployed address of your main Provenance proxy.
    */
   constructor(address _diamondAddress) {
      provenanceDiamond = IAccessControl(_diamondAddress);
   }

   /**
     * @notice Allows any user to request the ADMIN_ROLE for themselves.
     * @dev Also revokes any other roles the user might have for a clean demo state.
     */
   function requestAdminRoleRole() external {
      _revokeAllRoles(msg.sender);
      provenanceDiamond.grantRole(Constants.ADMIN_ROLE, msg.sender);
   }

   /**
     * @notice Allows any user to request the BRAND_ROLE for themselves.
     * @dev Also revokes any other roles the user might have for a clean demo state.
     */
   function requestBrandRole() external {
      _revokeAllRoles(msg.sender);
      provenanceDiamond.grantRole(Constants.BRAND_ROLE, msg.sender);
   }

   /**
     * @notice Allows any user to request the RETAILER_ROLE for themselves.
     * @dev Also grants BRAND_ROLE, as retailers are managed by brands.
     */
   function requestRetailerRole() external {
      _revokeAllRoles(msg.sender);
      provenanceDiamond.grantRole(Constants.RETAILER_ROLE, msg.sender);
   }

   /**
     * @notice Allows a user to revoke any special roles to become a default user.
     */
   function revokeAllMyRoles() external {
      _revokeAllRoles(msg.sender);
   }

   /**
     * @dev Internal helper to remove all roles from a user.
     */
   function _revokeAllRoles(address _user) internal {
      if (provenanceDiamond.hasRole(Constants.ADMIN_ROLE, _user)) {
         provenanceDiamond.revokeRole(Constants.ADMIN_ROLE, _user);
      }
      if (provenanceDiamond.hasRole(Constants.BRAND_ROLE, _user)) {
         provenanceDiamond.revokeRole(Constants.BRAND_ROLE, _user);
      }
      if (provenanceDiamond.hasRole(Constants.RETAILER_ROLE, _user)) {
         provenanceDiamond.revokeRole(Constants.RETAILER_ROLE, _user);
      }
   }
}
