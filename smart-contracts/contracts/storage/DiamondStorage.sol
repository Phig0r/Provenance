// contracts/storage/DiamondStorage.sol

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @notice Holds the state variables for the Diamond proxy mechanism.
 */
struct DiamondStorage {
    mapping(bytes4 => address) selectorToFacetAddress;
    address contractOwner;
}

/**
 * @notice The instruction set for a single facet update in a diamondCut.
 */
struct FacetCut {
    address facetAddress;
    FacetCutAction action;
    bytes4[] functionSelectors;
}

/**
 * @notice The possible actions for a diamondCut.
 */
enum FacetCutAction { Add, Replace, Remove }