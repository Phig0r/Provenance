import { expect } from "chai";
import { network } from "hardhat";

import AnyValue from "@nomicfoundation/hardhat-toolbox-mocha-ethers"
import {
   AccessControlFacet,
   AdminFacet,
   BrandFacet,
   ConsumerFacet,
   ERC721Facet,
   Provenance,
   RetailerFacet,
   DemoRoleFaucet
} from "../types/ethers-contracts/index.js";

import { FacetCutStruct } from "../types/ethers-contracts/utils/DiamondInit.sol/DiamondInit.js";

const brandStatus = {
   Pending: 0,
   Active: 1,
   Suspended: 2,
   Revoked: 3
};

const RetailerStatus = {
   Active: 0,
   Suspended: 1,
   Terminated: 2
}

const ProductStatus = {
   InFactory:0,
   InTransit:1,
   InRetailer:2,
   Sold:3
}

const FacetCutAction = { 
   Add: 0,
   Replace: 1,
   Remove: 2 
};

const { ethers } = await network.connect();


const [AddressType] = await ethers.getSigners();

describe("Provenance", function(){

   let provenance:Provenance;

   let adminFacet: AdminFacet, brandFacet: BrandFacet, retailerFacet: RetailerFacet, consumerFacet: ConsumerFacet;
   let erc721Facet: ERC721Facet, accessControlFacet: AccessControlFacet;

   let demoRoleFaucet: DemoRoleFaucet;
   

   const getSelectors = (contract: any) => {
      const selectors: string[] = [];
      contract.interface.forEachFunction((fragment: any) => {
         selectors.push(fragment.selector);
      });
      return selectors;
   };

   const DEFAULT_ADMIN_ROLE = ethers.ZeroHash;
   const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
   const BRAND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRAND_ROLE"));
   const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));
   
   const zeroAddress = ethers.ZeroAddress;
   let admin: typeof AddressType;
   let brand: typeof AddressType, brand2: typeof AddressType;
   let retailer: typeof AddressType;
   let consumer: typeof AddressType, consumer2: typeof AddressType;
   let unauthorizedSigner: typeof AddressType;
   let productAuthenticator1: typeof AddressType, productAuthenticator2: typeof AddressType;

   let tester: typeof AddressType;

   this.beforeEach(async function(){
      [
         admin,
         brand, brand2,
         retailer,
         consumer,consumer2,
         unauthorizedSigner,
         productAuthenticator1,productAuthenticator2,
         tester
      ] = await ethers.getSigners();

      adminFacet = await ethers.deployContract("AdminFacet");
      brandFacet = await ethers.deployContract("BrandFacet");
      retailerFacet = await ethers.deployContract("RetailerFacet");
      consumerFacet = await ethers.deployContract("ConsumerFacet");

      erc721Facet = await ethers.deployContract("ERC721Facet");
      accessControlFacet = await ethers.deployContract("AccessControlFacet");

      
      const cuts: FacetCutStruct[] = [
         {
            facetAddress: await adminFacet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(adminFacet),
         },
         {
            facetAddress: await brandFacet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(brandFacet),
         },
         {
            facetAddress: await retailerFacet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(retailerFacet),
         },
         {
            facetAddress: await consumerFacet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(consumerFacet),
         },
         {
            facetAddress: await erc721Facet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(erc721Facet),
         },
         {
            facetAddress: await accessControlFacet.getAddress(),
            action: FacetCutAction.Add,
            functionSelectors: getSelectors(accessControlFacet),
         },

      ];
      
      provenance = await ethers.deployContract("Provenance", [admin.address, cuts]);
      const provenanceAddress = await provenance.getAddress();

      demoRoleFaucet = await ethers.deployContract("DemoRoleFaucet", [provenanceAddress])

      adminFacet = await ethers.getContractAt('AdminFacet', provenanceAddress);
      brandFacet = await ethers.getContractAt('BrandFacet', provenanceAddress);
      retailerFacet = await ethers.getContractAt('RetailerFacet', provenanceAddress);
      consumerFacet = await ethers.getContractAt('ConsumerFacet', provenanceAddress);
      erc721Facet = await ethers.getContractAt('ERC721Facet', provenanceAddress);
      accessControlFacet = await ethers.getContractAt('AccessControlFacet', provenanceAddress);
      
      await accessControlFacet.connect(admin).grantRole(DEFAULT_ADMIN_ROLE, await demoRoleFaucet.getAddress());
      await accessControlFacet.connect(admin).grantRole(ADMIN_ROLE, await demoRoleFaucet.getAddress());
      await accessControlFacet.connect(admin).grantRole(BRAND_ROLE, await demoRoleFaucet.getAddress());
   });

   describe("Deployment", function(){
      it("Should grant the DEFAULT_ADMIN_ROLE to the deployer", async function(){
         expect(
            await accessControlFacet.hasRole(DEFAULT_ADMIN_ROLE, admin.address)
         ).to.be.true;
      });

      it("Should grant the ADMIN_ROLE to the deployer", async function(){
         expect(
            await accessControlFacet.hasRole(ADMIN_ROLE, admin.address)
         ).to.be.true;
      });
      
   })

   describe("Admin Role", function(){

      describe("registerBrand()", function(){

         it("Should successfully register a brand, update state, and grant role", async function (){
            const name = "Apple";
            const website = "apple.com";
            const brandAddress = brand.address;
            
            await expect(
               adminFacet.connect(admin).registerBrand(brandAddress, name, website)
            ).to.emit(adminFacet, "BrandRegistered")
            .withArgs(brandAddress, name, () => true)

            const brandProfile= await adminFacet.getBrandProfile(brandAddress);

            expect(brandProfile.name).to.be.equal(name);
            expect(brandProfile.website).to.be.equal(website);
            expect(brandProfile.status).to.be.equal(brandStatus.Pending);

            expect(
               await accessControlFacet.hasRole(BRAND_ROLE, brandAddress)
            ).to.be.true;
         });

         it("Should revert if a non-admin tries to register a brand", async function (){
            const name = "Apple";
            const website = "apple.com";
            const brandAddress = brand.address;

            await expect(
               adminFacet.connect(unauthorizedSigner).registerBrand(brandAddress, name, website)
            ).to.be.revertedWithCustomError(adminFacet,"AccessControlUnauthorizedAccount");
         });

         it("Should revert if a brand is zero address", async function (){
            const name = "Apple";
            const website = "apple.com";
            const brandAddress = zeroAddress;

            await expect(
               adminFacet.connect(admin).registerBrand(brandAddress, name, website)
            ).to.be.revertedWithCustomError(adminFacet, "ProvenanceZeroAddressNotAllowed");
         });

         it("Should revert if a brand already exists", async function (){
            const name = "Apple";
            const website = "apple.com";
            const brandAddress = brand.address;
            await adminFacet.connect(admin).registerBrand(brandAddress, name, website);
            await expect(
               adminFacet.registerBrand(brandAddress, name, website)
            ).to.be.revertedWithCustomError(adminFacet, "ProvenanceBrandAlreadyExists")
            .withArgs(brandAddress);
         });

      });

      describe("updateBrandStatus", function(){

         it("Should set a brand's status correctly and emit a BrandStatusUpdated event", async function (){
            const brandAddress = brand.address;
            const newStatus = brandStatus.Active;
            await adminFacet.connect(admin).registerBrand(brandAddress, "Apple", "apple.com");
      
            await expect(
               adminFacet.connect(admin).updateBrandStatus(brandAddress, newStatus)
            ).to.emit(adminFacet, "BrandStatusUpdated")

            const brandProfile= await adminFacet.getBrandProfile(brandAddress);
            expect(brandProfile.status).to.be.equal(newStatus);

         });

         it("Should revoke the BRAND_ROLE when a brand's status is set to Revoked", async function (){
            const brandAddress = brand.address;
            const newStatus = brandStatus.Revoked;
            await adminFacet.connect(admin).registerBrand(brandAddress, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brandAddress, newStatus);

            expect(
               await accessControlFacet.hasRole(BRAND_ROLE, brandAddress)
            ).to.be.false;

         });

         it("Should revert if a non-admin tries to update a brand", async function (){
            const brandAddress = brand.address;
            const newStatus = brandStatus.Active;
            await adminFacet.connect(admin).registerBrand(brandAddress, "Apple", "apple.com");

            await expect(
               adminFacet.connect(unauthorizedSigner).updateBrandStatus(brandAddress, newStatus)
            ).to.be.revertedWithCustomError(adminFacet,"AccessControlUnauthorizedAccount");
         });

         it("Should revert if a brand does not exist", async function (){
            const nonExistentBrandAddress = brand.address;
            const newStatus = brandStatus.Active;

            await expect(
               adminFacet.connect(admin).updateBrandStatus(nonExistentBrandAddress, newStatus)
            ).to.be.revertedWithCustomError(adminFacet, "ProvenanceBrandNotFound")
            .withArgs(nonExistentBrandAddress);
         });

         it("Should revert when attempting to update a permanently revoked brand", async function (){
            const brandAddress = brand.address;
            let newStatus = brandStatus.Revoked;
            await adminFacet.connect(admin).registerBrand(brandAddress, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brandAddress, newStatus);

            newStatus = brandStatus.Active
            await expect(
               adminFacet.connect(admin).updateBrandStatus(brandAddress, newStatus)
            ).to.be.revertedWithCustomError(adminFacet, "ProvenanceBrandPermanentlyRevoked")
            .withArgs(brandAddress);
         });

      })

   })

   describe("Brand Role", function(){
      
      describe("mintProduct()", function(){
         
         it("Should mint a product, emit an event, and correctly update state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            
            await expect(
               brandFacet.connect(brand).mintProduct(name, productAuth)
            ).to.emit(brandFacet,"ProductMinted")
            .withArgs(brand.address, 1, name, productAuth,() => true);

            expect(
               await erc721Facet.ownerOf(1)
            ).to.be.equal(brand.address);

            const productProfile = await consumerFacet.getProductDetails(1);
            expect(productProfile.name).to.be.equal(name);
            expect(productProfile.productAuthenticator).to.be.equal(productAuth);
            expect(productProfile.brandAddress).to.be.equal(brand.address);

         });

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            
            await expect(
               brandFacet.connect(unauthorizedSigner).mintProduct(name, productAuth)
            ).to.be.revertedWithCustomError(brandFacet, "AccessControlUnauthorizedAccount");

         });

         it("Should revert if the calling brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            
            await expect(
               brandFacet.connect(brand).mintProduct(name, productAuth)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceBrandNotActive")
            .withArgs(brand.address, brandStatus.Pending);
         });

         it("Should revert if the product authenticator is the zero address", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            const name = "iphone 16 pro";
            const productAuth = zeroAddress;
            
            await expect(
               brandFacet.connect(brand).mintProduct(name, productAuth)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceZeroAddressNotAllowed");
         })

      });

      describe("registerRetailer()", function(){

         it("Should register a retailer, update state, and grant the RETAILER_ROLE", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            
            await expect(
               brandFacet.connect(brand).registerRetailer(retailerAddress, name)
            ).to.emit(brandFacet, "RetailerRegistered")
            .withArgs(brand.address, retailerAddress, name,() => true);

            const retailerProfile = await brandFacet.getRetailerProfile(retailerAddress);
            expect(retailerProfile.brandAddress).to.be.equal(brand.address);
            expect(retailerProfile.status).to.be.equal(RetailerStatus.Active);

            expect(
               await accessControlFacet.hasRole(RETAILER_ROLE, retailerAddress)
            ).to.be.true;
         });

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            const name = "Best Buy";
            const retailerAddress = retailer.address;

            await expect(
               brandFacet.connect(unauthorizedSigner).registerRetailer(retailerAddress, name)
            ).to.be.revertedWithCustomError(brandFacet,"AccessControlUnauthorizedAccount");

         });

         it("Should revert if the calling brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            
            const name = "Best Buy";
            const retailerAddress = retailer.address;
            
            await expect(
               brandFacet.connect(brand).registerRetailer(retailerAddress, name)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceBrandNotActive")
            .withArgs(brand.address, brandStatus.Pending);
         });

         it("Should revert if the retailer address is the zero address", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = zeroAddress;
            
            await expect(
               brandFacet.connect(brand).registerRetailer(retailerAddress, name)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceZeroAddressNotAllowed");
         });

         it("Should revert if the retailer is already registered", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            await brandFacet.connect(brand).registerRetailer(retailerAddress, name)
            
            await expect(
               brandFacet.connect(brand).registerRetailer(retailerAddress, name)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceRetailerAlreadyExists")
            .withArgs(retailerAddress);
         });
      });

      describe("updateRetailerStatus()", function(){

         it("Should update a retailer's status and emit a RetailerStatusUpdated event", async function (){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Suspended;

            await brandFacet.connect(brand).registerRetailer(retailerAddress, name);
            
            await expect(
               brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus)
            ).to.emit(brandFacet, "RetailerStatusUpdated")
            .withArgs(retailerAddress, newStatus,() => true);

            const retailerProfile= await brandFacet.getRetailerProfile(retailerAddress);
            expect(retailerProfile.status).to.be.equal(newStatus);

         });

         it("Should revoke the RETAILER_ROLE when status is set to Terminated", async function (){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Terminated;

            await brandFacet.connect(brand).registerRetailer(retailerAddress, name);
            await brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus)
            
            expect(
               await accessControlFacet.hasRole(RETAILER_ROLE, retailerAddress)
            ).to.be.false

         });

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Suspended;

            await expect(
               brandFacet.connect(unauthorizedSigner).updateRetailerStatus(retailerAddress, newStatus)
            ).to.be.revertedWithCustomError(brandFacet ,"AccessControlUnauthorizedAccount");

         });

         it("Should revert if the calling brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Suspended;
            await brandFacet.connect(brand).registerRetailer(retailerAddress, name);

            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Suspended);

            await expect(
               brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceBrandNotActive")
            .withArgs(brand.address, brandStatus.Suspended);
         });

         it("Should revert if a brand tries to manage a retailer it does not own", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            await adminFacet.connect(admin).registerBrand(brand2.address, "Samsung", "samsung.com");
            await adminFacet.connect(admin).updateBrandStatus(brand2.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Suspended;
            await brandFacet.connect(brand).registerRetailer(retailerAddress, name);

            await expect(
               brandFacet.connect(brand2).updateRetailerStatus(retailerAddress, newStatus)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceNotAuthorizedToManageRetailer")
            .withArgs(brand2.address, retailerAddress);
         });

         it("Should revert if the retailer is not registered", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const retailerAddress = retailer.address;
            const newStatus = RetailerStatus.Suspended;

            await expect(
               brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceRetailerNotFound")
            .withArgs(retailerAddress);
         });

         it("Should revert when attempting to update a permanently terminated retailer", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "Best Buy";
            const retailerAddress = retailer.address;
            await brandFacet.connect(brand).registerRetailer(retailerAddress, name);
            
            let newStatus = RetailerStatus.Terminated;
            await brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus);

            newStatus = RetailerStatus.Active;
            await expect(
               brandFacet.connect(brand).updateRetailerStatus(retailerAddress, newStatus)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceRetailerPermanentlyTerminated")
            .withArgs(retailerAddress);
         });
      });

      describe("initiateShipment()", function(){

         it("Should transfer ownership and update status for all products in a shipment", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);

            await expect(
               brandFacet.connect(brand).initiateShipment([1,2], retailer.address)
            ).to.emit(brandFacet, "ShipmentInitiated")
            .withArgs(brand.address, retailer.address, [1,2],() => true);

            expect(await erc721Facet.ownerOf(1)).to.be.equal(retailer.address);
            expect(await erc721Facet.ownerOf(2)).to.be.equal(retailer.address);

            const product1 = await consumerFacet.getProductDetails(1);
            const product2 = await consumerFacet.getProductDetails(2);

            expect(product1.status).to.be.equal(ProductStatus.InTransit);
            expect(product2.status).to.be.equal(ProductStatus.InTransit);
         });

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address)

            const consumerAddress = consumer.address;

            await expect(
               brandFacet.connect(unauthorizedSigner).initiateShipment([1,2], consumerAddress)
            ).to.be.revertedWithCustomError(brandFacet ,"AccessControlUnauthorizedAccount");

         });

         it("Should revert if the calling brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator1.address);
            
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Suspended);

            await expect(
               brandFacet.connect(brand).initiateShipment([1], retailer.address)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceBrandNotActive")
            .withArgs(brand.address, brandStatus.Suspended);

         });

         it("Should revert if the target retailer is not registered", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator1.address);
            
            await expect(
               brandFacet.connect(brand).initiateShipment([1], retailer.address)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceRetailerNotFound")
            .withArgs(retailer.address);

         });

         it("Should revert if the target retailer is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).updateRetailerStatus(retailer.address, RetailerStatus.Suspended);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator1.address);

            await expect(
               brandFacet.connect(brand).initiateShipment([1], retailer.address)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceRetailerNotActive")
            .withArgs(retailer.address, RetailerStatus.Suspended);

         });

         it("Should revert if any product in the shipment is not in the InFactory state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).initiateShipment([1], retailer.address)
            
            await retailerFacet.connect(retailer).receiveProductShipment([1]);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);

            await expect(
               brandFacet.connect(brand).initiateShipment([1,2], retailer.address)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceInvalidProductStatus")
            .withArgs(1, ProductStatus.InRetailer, ProductStatus.InFactory);

         });

         it("Should revert if the brand does not own all products in the shipment", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            await adminFacet.connect(admin).registerBrand(brand2.address, "Samsung", "samsung.com");
            await adminFacet.connect(admin).updateBrandStatus(brand2.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            
            await brandFacet.connect(brand2).mintProduct("iphone 16 pro", productAuthenticator2.address);

            await expect(
               brandFacet.connect(brand).initiateShipment([1,2], retailer.address)
            ).to.be.revertedWithCustomError(brandFacet, "ERC721InsufficientApproval")

         });

      })
      
      describe("confirmReturnReceipt()", function(){

         it("Should set product status to InFactory and emit a ReturnReceived event", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await retailerFacet.connect(retailer).returnProducts([1,2]);

            await expect(
               brandFacet.connect(brand).confirmReturnReceipt([1,2])
            ).to.emit(brandFacet,"ReturnReceived");

            const product1 = await consumerFacet.getProductDetails(1);
            const product2 = await consumerFacet.getProductDetails(2);

            expect(product1.status).to.be.equal(ProductStatus.InFactory);
            expect(product2.status).to.be.equal(ProductStatus.InFactory);

            expect(await erc721Facet.ownerOf(1)).to.be.equal(brand.address)
            expect(await erc721Facet.ownerOf(2)).to.be.equal(brand.address)
         });

         it("Should revert if the caller is not the owner of the product", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            await adminFacet.connect(admin).registerBrand(brand2.address, "Samsung", "samsung.com");
            await adminFacet.connect(admin).updateBrandStatus(brand2.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).initiateShipment([1], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1]);
            await retailerFacet.connect(retailer).returnProducts([1]);

            await expect(
               brandFacet.connect(brand2).confirmReturnReceipt([1])
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceNotProductOwner")
            .withArgs(brand2.address, 1, brand.address);
         });

         it("Should revert if the product is not in the InTransit state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).initiateShipment([1], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1]);
            await retailerFacet.connect(retailer).returnProducts([1]);
            
            await brandFacet.connect(brand).confirmReturnReceipt([1]);
            
            await expect(
               brandFacet.connect(brand).confirmReturnReceipt([1])
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceInvalidProductStatus")
            .withArgs(1, ProductStatus.InFactory, ProductStatus.InTransit);
         });

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            await expect(
               brandFacet.connect(unauthorizedSigner).confirmReturnReceipt([1])
            ).to.be.revertedWithCustomError(brandFacet ,"AccessControlUnauthorizedAccount");
         });


      })
      
      describe("fulfillDirectOrder()", function(){
         
         it("Should transfer ownership, update status to Sold, and emit an event", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            await brandFacet.connect(brand).mintProduct(name, productAuth);

            const tokenId = 1;
            const consumerAddress = consumer.address;
            
            await expect(
               brandFacet.connect(brand).fulfillDirectOrder(tokenId,consumerAddress)
            ).to.emit(brandFacet, "BrandFulfilledDirectOrder")
            .withArgs(brand.address, consumerAddress, tokenId,() => true);

            expect(
               await erc721Facet.ownerOf(1)
            ).to.be.equal(consumerAddress);

            const productProfile = await consumerFacet.getProductDetails(tokenId);
            expect(productProfile.status).to.be.equal(ProductStatus.Sold);

         })

         it("Should revert if called by an account without the BRAND_ROLE", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            await brandFacet.connect(brand).mintProduct(name, productAuth);

            const tokenId = 1;
            const consumerAddress = consumer.address;
            await expect(
               brandFacet.connect(unauthorizedSigner).fulfillDirectOrder(tokenId, consumerAddress)
            ).to.be.revertedWithCustomError(brandFacet ,"AccessControlUnauthorizedAccount");

         });

         it("Should revert if the calling brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            await brandFacet.connect(brand).mintProduct(name, productAuth);
            
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Suspended);

            const tokenId = 1;
            const consumerAddress = consumer.address;
            await expect(
               brandFacet.connect(brand).fulfillDirectOrder(tokenId, consumerAddress)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceBrandNotActive")
            .withArgs(brand.address, brandStatus.Suspended);
         });

         it("Should revert if the product is not in the InFactory state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");

            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            await brandFacet.connect(brand).mintProduct(name, productAuth);
            const tokenId = 1;

            await brandFacet.connect(brand).initiateShipment([tokenId], retailer.address);

            const consumerAddress = consumer.address;
            await expect(
               brandFacet.connect(brand).fulfillDirectOrder(tokenId, consumerAddress)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceInvalidProductStatus")
            .withArgs(tokenId, ProductStatus.InTransit, ProductStatus.InFactory);
         });

         it("Should revert if the consumer is the zero address", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);

            const name = "iphone 16 pro";
            const productAuth = productAuthenticator1.address;
            await brandFacet.connect(brand).mintProduct(name, productAuth);
            
            const tokenId = 1;
            const consumerAddress = zeroAddress;
            await expect(
               brandFacet.connect(brand).fulfillDirectOrder(tokenId, consumerAddress)
            ).to.be.revertedWithCustomError(brandFacet, "ProvenanceZeroAddressNotAllowed");
         });
      
      })
 

   });

   describe("Retailer Role", function(){
      
      describe("receiveProductShipment()", function(){
         
         it("Should update product statuses to InRetailer and emit a ShipmentReceived event", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            
            await expect(
               retailerFacet.connect(retailer).receiveProductShipment([1,2])
            ).to.emit(retailerFacet, "ShipmentReceived")
            .withArgs(retailer.address, [1,2],() => true)
         
            const product1 = await consumerFacet.getProductDetails(1);
            const product2 = await consumerFacet.getProductDetails(2);

            expect(product1.status).to.be.equal(ProductStatus.InRetailer);
            expect(product2.status).to.be.equal(ProductStatus.InRetailer);

         });

         it("Should revert if called by an account without the RETAILER_ROLE", async function(){            
            await expect(
               retailerFacet.connect(unauthorizedSigner).receiveProductShipment([1,2])
            ).to.be.revertedWithCustomError(retailerFacet ,"AccessControlUnauthorizedAccount");

         });

         it("Should revert if the parent brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);

            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Revoked);
            await expect(
               retailerFacet.connect(retailer).receiveProductShipment([1,2])
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceParentBrandNotActive")
            .withArgs(retailer.address, brand.address);

         });

         it("Should revert if the calling retailer is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);

            await brandFacet.connect(brand).updateRetailerStatus(retailer.address, RetailerStatus.Suspended);
            await expect(
               retailerFacet.connect(retailer).receiveProductShipment([1,2])
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceRetailerNotActive")
            .withArgs(retailer.address, RetailerStatus.Suspended);

         });

         it("Should revert if the caller does not own all products in the shipment", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1], retailer.address);

            await expect(
               retailerFacet.connect(retailer).receiveProductShipment([1,2])
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceNotProductOwner")
            .withArgs(retailer.address, 2, brand.address);

         });

         it("Should revert if a product in the shipment has already been received", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1,2])
            await expect(
               retailerFacet.connect(retailer).receiveProductShipment([1,2])
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceInvalidProductStatus")
            .withArgs(1, ProductStatus.InRetailer, ProductStatus.InTransit);

         });
         
      });

      describe("returnProducts()", function(){

         it("Should transfer ownership back to the brand and update status to InTransit", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);

            await expect(
               retailerFacet.connect(retailer).returnProducts([1,2])
            ).to.emit(retailerFacet, "ShipmentReturned")
            .withArgs(retailer.address, brand.address, [1,2],() => true);

            const product1 = await consumerFacet.getProductDetails(1);
            const product2 = await consumerFacet.getProductDetails(2);

            expect(product1.status).to.be.equal(ProductStatus.InTransit);
            expect(product2.status).to.be.equal(ProductStatus.InTransit);

            expect(await erc721Facet.ownerOf(1)).to.be.equal(brand.address)
            expect(await erc721Facet.ownerOf(2)).to.be.equal(brand.address)
         });

         it("Should revert if a product is not in the InRetailer state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await retailerFacet.connect(retailer).finalizeSale(1,consumer.address);

            await expect(
               retailerFacet.connect(retailer).returnProducts([1,2])
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceInvalidProductStatus")
            .withArgs(1, ProductStatus.Sold, ProductStatus.InRetailer);

         });

         it("Should revert if called by an account without the RETAILER_ROLE", async function(){
            await expect(
               retailerFacet.connect(unauthorizedSigner).returnProducts([1,2])
            ).to.be.revertedWithCustomError(retailerFacet ,"AccessControlUnauthorizedAccount");
         });

      });

      describe("finalizeSale()", function(){

         it("Should transfer ownership to consumer, update status to Sold, and emit an event", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);

            await expect(
               retailerFacet.connect(retailer).finalizeSale(1,consumer.address)
            ).to.emit(retailerFacet, "ProductSold")
            .withArgs(consumer.address, retailer.address, 1,() => true);

            const product1 = await consumerFacet.getProductDetails(1);

            expect(product1.status).to.be.equal(ProductStatus.Sold);

            expect(await erc721Facet.ownerOf(1)).to.be.equal(consumer.address)
         });

         it("Should revert if the parent brand is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Suspended);

            await expect(
               retailerFacet.connect(retailer).finalizeSale(1,consumer.address)
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceParentBrandNotActive")
            .withArgs(retailer.address, brand.address);
         });

         it("Should revert if the calling retailer is not in an Active state", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await brandFacet.connect(brand).updateRetailerStatus(retailer.address, RetailerStatus.Suspended);

            await expect(
               retailerFacet.connect(retailer).finalizeSale(1,consumer.address)
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceRetailerNotActive")
            .withArgs(retailer.address, RetailerStatus.Suspended);
         });

         it("Should revert if the calling retailer is not the owner of the product", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1]);

            await expect(
               retailerFacet.connect(retailer).finalizeSale(2,consumer.address)
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceNotProductOwner")
            .withArgs(retailer.address, 2, brand.address);
         });

         it("Should revert if the product is not available for sale (already sold)", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await retailerFacet.connect(retailer).finalizeSale(2,consumer.address)
            await expect(
               retailerFacet.connect(retailer).finalizeSale(2,consumer2.address)
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceNotProductOwner");
         });

         it("Should revert if the consumer is the zero address", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator1.address);
            await brandFacet.connect(brand).mintProduct("iphone 16 pro", productAuthenticator2.address);
            await brandFacet.connect(brand).initiateShipment([1,2], retailer.address);
            await retailerFacet.connect(retailer).receiveProductShipment([1,2]);
            await expect(
               retailerFacet.connect(retailer).finalizeSale(2,zeroAddress)
            ).to.be.revertedWithCustomError(retailerFacet, "ProvenanceZeroAddressNotAllowed");
         });

         it("Should revert if called by an account without the RETAILER_ROLE", async function(){
            await expect(
               retailerFacet.connect(unauthorizedSigner).finalizeSale(1,consumer.address)
            ).to.be.revertedWithCustomError(retailerFacet, "AccessControlUnauthorizedAccount")
            .withArgs(unauthorizedSigner.address, RETAILER_ROLE);
         });

      })
   });

   describe("Consumer Role", function(){
      
      describe("consumeVerification()", function(){

         it("should verify the product", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            const productAuthenticator = ethers.Wallet.createRandom();
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator);

            const tokenId = 1;
            const challenge = 55555;

            const messageHash = ethers.keccak256(
               ethers.solidityPacked(["uint256", "uint256"], [tokenId, challenge])
            );

            const signature = await productAuthenticator.signMessage(ethers.getBytes(messageHash));

            await expect(
               consumerFacet.consumeVerification(tokenId, challenge, signature)
            ).to.emit(consumerFacet, "ProductVerified");
         });

         it("should prevent fraudulent verification by rejecting an invalid signature", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            const productAuthenticator = ethers.Wallet.createRandom();
            const productAuthenticator2 = ethers.Wallet.createRandom();
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator);

            const tokenId = 1;
            const challenge = 55555;

            const messageHash = ethers.keccak256(
               ethers.solidityPacked(["uint256", "uint256"], [tokenId, challenge])
            );

            const signature = await productAuthenticator2.signMessage(ethers.getBytes(messageHash));

            await expect(
               consumerFacet.consumeVerification(1, challenge, signature)
            ).to.be.revertedWithCustomError(consumerFacet, "ProvenanceInvalidSignature")
         });

         it("should prevent replay attacks by rejecting a used nonce", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            
            const productAuthenticator = ethers.Wallet.createRandom();
            await brandFacet.connect(brand).registerRetailer(retailer.address, "Best Buy");
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator);

            const tokenId = 1;
            const challenge = 55555;

            const messageHash = ethers.keccak256(
               ethers.solidityPacked(["uint256", "uint256"], [tokenId, challenge])
            );
            
            const signature = await productAuthenticator.signMessage(ethers.getBytes(messageHash));
            await consumerFacet.consumeVerification(tokenId, challenge, signature)

            await expect(
               consumerFacet.consumeVerification(tokenId, challenge, signature)
            ).to.be.revertedWithCustomError(consumerFacet, "ProvenanceNonceAlreadyUsed")
            .withArgs(tokenId, challenge);
         });

      });

      describe("getProductDetails()", function(){
         it("should revert when getting details for a non-existent product", async function(){
            const nonExistentTokenId = 999;
            await expect(
               consumerFacet.getProductDetails(nonExistentTokenId)
            ).to.be.revertedWithCustomError(consumerFacet, "ProvenanceProductNotFound")
             .withArgs(nonExistentTokenId);
         });
      });

      describe("isNonceAlreadyUsed()", function(){

         it("should return false for an unused nonce", async function(){
            expect(
               await consumerFacet.isNonceAlreadyUsed(1, 12345)
            ).to.be.false;
         });

         it("should return true for a used nonce after verification", async function(){
            await adminFacet.connect(admin).registerBrand(brand.address, "Apple", "apple.com");
            await adminFacet.connect(admin).updateBrandStatus(brand.address, brandStatus.Active);
            const productAuthenticator = ethers.Wallet.createRandom();
            await brandFacet.connect(brand).mintProduct("iphone 16", productAuthenticator.address);
            
            const tokenId = 1;
            const challenge = 55555;
            const messageHash = ethers.keccak256(
               ethers.solidityPacked(["uint256", "uint256"], [tokenId, challenge])
            );
            const signature = await productAuthenticator.signMessage(ethers.getBytes(messageHash));

            await consumerFacet.consumeVerification(tokenId, challenge, signature);

            expect(
               await consumerFacet.isNonceAlreadyUsed(tokenId, challenge)
            ).to.be.true;
         });

      });
   });

   describe("DemoRoleFaucet", function(){
      
      describe("requestAdminRoleRole", function(){
         it("should grant the ADMIN_ROLE to the caller", async function(){
            
            await demoRoleFaucet.connect(tester).requestAdminRoleRole();
            expect (
               await accessControlFacet.connect(admin).hasRole(ADMIN_ROLE, tester.address)
            ).to.be.true;
         })
      });

      describe("requestBrandRole", function(){
         it("should grant the BRAND_ROLE to the caller", async function(){
            await demoRoleFaucet.connect(tester).requestBrandRole();
            expect (
               await accessControlFacet.connect(admin).hasRole(BRAND_ROLE, tester.address)
            ).to.be.true;
         })
      });

      describe("requestRetailerRole", function(){
         it("should grant RETAILER_ROLE to the caller", async function(){
            await demoRoleFaucet.connect(tester).requestRetailerRole();
            expect (
               await accessControlFacet.connect(admin).hasRole(RETAILER_ROLE, tester.address)
            ).to.be.true;
         })
      });

      describe("revokeAllMyRoles", function(){
         it("should revoke all roles from the caller", async function(){
            await demoRoleFaucet.connect(tester).requestAdminRoleRole();

            await demoRoleFaucet.connect(tester).revokeAllMyRoles();
            
            expect (
               await accessControlFacet.connect(admin).hasRole(ADMIN_ROLE, tester.address)
            ).to.be.false;

            expect (
               await accessControlFacet.connect(admin).hasRole(BRAND_ROLE, tester.address)
            ).to.be.false;

            expect (
               await accessControlFacet.connect(admin).hasRole(RETAILER_ROLE, tester.address)
            ).to.be.false;
         })
      });
   })
})