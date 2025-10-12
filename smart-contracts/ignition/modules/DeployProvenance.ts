import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import { ethers, Interface  } from "ethers";
import { 
   AdminFacet__factory,
   BrandFacet__factory,
   RetailerFacet__factory,
   ConsumerFacet__factory,
   ERC721Facet__factory,
   AccessControlFacet__factory
} from "../../types/ethers-contracts/index.js";


const getSelectors = (contractInterface: Interface) => {
   const selectors: string[] = [];
   contractInterface.forEachFunction((fragment) => {
      selectors.push(fragment.selector);
   });
   return selectors;
};

export default buildModule("ProvenanceModule", (m) => {
   const adminFacet = m.contract("AdminFacet");
   const brandFacet = m.contract("BrandFacet", [], { after: [adminFacet] });
   const retailerFacet = m.contract("RetailerFacet", [], { after: [brandFacet] });
   const consumerFacet = m.contract("ConsumerFacet", [], { after: [retailerFacet] });
   const erc721Facet = m.contract("ERC721Facet", [], { after: [consumerFacet] });
   const accessControlFacet = m.contract("AccessControlFacet", [], { after: [erc721Facet] });

   const adminInterface = new ethers.Interface(AdminFacet__factory.abi);
   const brandInterface = new ethers.Interface(BrandFacet__factory.abi);
   const retailerInterface = new ethers.Interface(RetailerFacet__factory.abi);
   const consumerInterface = new ethers.Interface(ConsumerFacet__factory.abi);
   const erc721Interface = new ethers.Interface(ERC721Facet__factory.abi);
   const accessControlInterface = new ethers.Interface(AccessControlFacet__factory.abi);

   const owner = m.getAccount(0);

   const cuts = [
      {
         facetAddress: adminFacet,
         action: 0,
         functionSelectors: getSelectors(adminInterface),
      },
      {
         facetAddress: brandFacet,
         action: 0,
         functionSelectors: getSelectors(brandInterface),
      },
      {
         facetAddress: retailerFacet,
         action: 0,
         functionSelectors: getSelectors(retailerInterface),
      },
      {
         facetAddress:  consumerFacet,
         action: 0,
         functionSelectors: getSelectors(consumerInterface),
      },
      {
         facetAddress:  erc721Facet,
         action: 0,
         functionSelectors: getSelectors(erc721Interface),
      },
      {
         facetAddress:  accessControlFacet,
         action: 0,
         functionSelectors: getSelectors(accessControlInterface),
      },

   ];

   const provenanceDiamond = m.contract("Provenance", [owner,cuts]);
   const demoRoleFaucet = m.contract("DemoRoleFaucet",[provenanceDiamond])
   
   const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
   const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
   const BRAND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRAND_ROLE"));
   
   const accessControl = m.contractAt(
      "AccessControlFacet", 
      provenanceDiamond,{
      id: "AccessControlPointer", 
   });
   
   m.call(
      accessControl,
      "grantRole",
      [DEFAULT_ADMIN_ROLE, demoRoleFaucet], {
      id: "GrantDefaultAdminRoleToFaucet", 
   });

   m.call(
      accessControl,
      "grantRole",
      [ADMIN_ROLE, demoRoleFaucet], {
      id: "GrantAdminRoleToFaucet", 
   });
   
   m.call(
      accessControl,
      "grantRole",
      [BRAND_ROLE, demoRoleFaucet], {
    id: "GrantBrandRoleToFaucet", 
   });


   return {
      provenanceDiamond,
      demoRoleFaucet,
      adminFacet,
      brandFacet,
      retailerFacet,
      consumerFacet,
      erc721Facet,
      accessControlFacet,
   };
});