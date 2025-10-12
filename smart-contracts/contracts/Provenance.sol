// contracts/Provenance.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./libraries/LibDiamond.sol";
import "./libraries/LibAppStorage.sol";
import "./libraries/Constants.sol";

import "./storage/DiamondStorage.sol";
import "./storage/AppStorage.sol";

contract Provenance {

    /**
     * @notice Deploys the contract, sets the owner, and performs the initial setup.
     * @dev This constructor initializes all core state variables, including the contract owner, NFT metadata,
     * role-based access control hierarchy, and performs the initial `diamondCut` to add all the
     * essential facets to the system in a single transaction.
     * @param _contractOwner The address that will have ownership over the Diamond's upgrade functionality.
     * @param _diamondCut The array of `FacetCut` structs for the initial facet setup.
     */
    constructor(
        address _contractOwner,
        FacetCut[] memory _diamondCut
    ) {
        LibDiamond.setOwner(_contractOwner);
        
        AppStorage storage ds = LibAppStorage.appStorage();
        
        ds._name = "Provenance Digital Twin";
        ds._symbol = "PROV";
        ds._nextTokenId = 1;

        address deployer = msg.sender; 
        
        ds._roles[Constants.DEFAULT_ADMIN_ROLE].hasRole[deployer] = true;
        ds._roles[Constants.ADMIN_ROLE].hasRole[deployer] = true;

        ds._roles[Constants.ADMIN_ROLE].adminRole = Constants.DEFAULT_ADMIN_ROLE;
        ds._roles[Constants.BRAND_ROLE].adminRole = Constants.ADMIN_ROLE;
        ds._roles[Constants.RETAILER_ROLE].adminRole = Constants.BRAND_ROLE;

        LibDiamond.diamondCut(_diamondCut, address(0), "");
    }

    /**
     * @notice Explicitly rejects any direct Ether transfers to the contract.
     * @dev This contract is not designed to hold a plain Ether balance. Payable functions in facets
     * are still supported via the `fallback` function.
     */
    receive() external payable {
        revert("This contract does not accept plain Ether transfers.");
    }
    
    /**
     * @dev The central router for the Diamond. It is executed on every function call that does not match
     * another function in this contract. It looks up the function signature in its storage to find the
     * correct facet address and then uses `delegatecall` to execute the facet's code in the context
     * of this contract's storage. Must be `payable` to support payable functions in facets.
     */
    fallback() external payable {
        DiamondStorage storage ds = LibDiamond.diamondStorage();
        address facetAddress = ds.selectorToFacetAddress[msg.sig];

        require(facetAddress != address(0), "Provenance: Function does not exist.");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facetAddress, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
            case 0 {
                revert(0, returndatasize())
            }
            default {
                return(0, returndatasize())
            }
        }
    }

    /**
     * @notice Adds, replaces, or removes functions in the Diamond.
     * @dev This is the master control function for all future upgrades. It can only be called by the contract owner.
     * It allows for the modification of the function-to-facet mapping and can optionally run an initializer
     * function as part of an upgrade.
     * @param _diamondCut An array of `FacetCut` structs detailing the upgrade actions.
     * @param _init The address of a contract to call for initialization after the cut. Use address(0) if none.
     * @param _calldata The function call data to send to the `_init` contract. Use empty bytes if none.
     */
    function diamondCut(
        FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external {
        LibDiamond.enforceIsOwner();
        LibDiamond.diamondCut(_diamondCut, _init, _calldata);
    }


}