// In scripts/generateSelectors.ts
import { ethers, Interface  } from "ethers";

import { 
   AdminFacet__factory,
   BrandFacet__factory,
   RetailerFacet__factory,
   ConsumerFacet__factory,
   ERC721Facet__factory,
   AccessControlFacet__factory
} from "../types/ethers-contracts/index.js";

const getSelectors = (contractInterface: Interface) => {
   const selectors: string[] = [];
   contractInterface.forEachFunction((fragment) => {
      selectors.push(fragment.selector);
   });
   return selectors;
};

async function main() {
   console.log("--- Function Selectors for provenanceArgs.js ---");

   const interfaces = {
      adminInterface : new ethers.Interface(AdminFacet__factory.abi),
      brandInterface : new ethers.Interface(BrandFacet__factory.abi),
      retailerInterface : new ethers.Interface(RetailerFacet__factory.abi),
      consumerInterface : new ethers.Interface(ConsumerFacet__factory.abi),
      erc721Interface : new ethers.Interface(ERC721Facet__factory.abi),
      accessControlInterface : new ethers.Interface(AccessControlFacet__factory.abi),
   };

   for (const [name, iface] of Object.entries(interfaces)) {
      console.log(`\n// --- ${name} ---`);
      console.log(JSON.stringify(getSelectors(iface), null, 2).replace(/"/g, "'"));
   }
}

main().catch((error) => {
   console.error(error);
   process.exitCode = 1;
});