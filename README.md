# Provenance - Digital Twin Product Authentication System

![License](https://img.shields.io/badge/license-MIT-blue.svg)  
![Status](https://img.shields.io/badge/status-Deployed-green.svg)

A blockchain-based platform for creating **digital twins** of physical products and implementing **provenance tracking** throughout the supply chain. This system addresses counterfeiting, supply chain transparency, and product authenticity by creating immutable, verifiable records that track products from manufacturing to consumer purchase using **PUF (Physical Unclonable Functions)** technology and smart contracts.

---

## Live Demo & Documentation

- **Live Application:** [Launch dApp](https://provenance-five.vercel.app/)
- **Full Technical Documentation:** *[documentation file](./documentation/Documentation.pdf)*

---

## Problem Statement

Traditional product authentication and supply chain tracking suffer from:

- **Counterfeiting & Fraud:** Fake products flood markets, damaging brand reputation and consumer trust.
- **Supply Chain Opacity:** Lack of transparency in product journey from manufacturer to consumer.
- **Inefficient Verification:** Manual verification processes are time-consuming and error-prone.
- **No Ownership Proof:** Consumers cannot verify product authenticity independently.

This project solves these issues by creating a secure, decentralized system that enables brands to create digital twins of their products, track them through the supply chain, and allow consumers to verify authenticity using blockchain technology and PUF-based hardware authentication.

---

## Key Features

- **Digital Twin Creation** – Brands can mint NFTs representing physical products with unique authenticators.
- **PUF Integration** – Physical Unclonable Functions provide hardware-based authentication for tamper-proof verification.
- **Supply Chain Tracking** – Complete product lifecycle management from factory to consumer with immutable records.
- **Role-Based Access Control:** Secure multi-tiered system (`ADMIN_ROLE`, `BRAND_ROLE`, `RETAILER_ROLE`, `CONSUMER_ROLE`) governing platform access.
- **Real-Time Verification** – Public-facing verification tool allows instant product authenticity checks.
- **Secure Demo Testing** – A `DemoRoleFaucet` contract allows safe, temporary role assignments for evaluation without compromising security.

---

## Tech Stack

| Layer          | Technologies |
|----------------|--------------|
| Blockchain     | Solidity, Hardhat, Ethers.js, Diamond Pattern Architecture |
| Frontend       | React, TypeScript, Vite, CSS Modules |
| Backend        | Node.js, Express, MongoDB Atlas |
| Authentication | PUF (Physical Unclonable Functions), Cryptographic Signatures |
| Testing        | Chai, Hardhat Test Helpers, Solidity Coverage |
| Deployment     | Hardhat Ignition (Smart Contracts) |

---

## Project Structure

* `/smart-contracts`: The Hardhat project containing Diamond Pattern smart contracts, comprehensive test suite, and deployment scripts.
* `/frontend`: The Vite + React web application with role-based dashboards for all user types.
* `/backend`: Node.js server for PUF keypair management and API endpoints.
* `/documentation`: Contains the complete technical project report (`Documentation.pdf`), system diagrams (`.svg` files), and UI mockups.

---

## Installation & Local Setup
To run this project locally, follow these steps.

### Prerequisites
- Node.js (v18+)
- npm or yarn
- MetaMask browser extension *(preferred)*
- MongoDB Atlas account *(for backend)*

### Steps to Run the Project Locally (Using Existing Deployed Contracts)

#### 1. Clone the repository
```bash
git clone https://github.com/Phig0r/Provenance
```
#### 2. Navigate to the frontend directory
```bash
cd provenance/frontend
```

#### 3. Install frontend dependencies
```bash
npm install
```

#### 4. Start the development server
```bash
npm run dev
```

### (Optional) Run Backend Server
To enable full functionality including PUF simulation:

#### 1. Navigate to the backend directory
```bash
cd provenance/backend
```

#### 2. Install dependencies
```bash
npm install
```

#### 3. Create a .env file with your MongoDB connection
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/provenance
PORT=3001
FRONTEND_URL=http://localhost:5173
```

#### 4. Start the backend server
```bash
npm run dev
```

### (Optional) Deploy and Test Your Own Smart Contracts
If you want to run tests or deploy a new instance of the smart contracts:

#### 1. Navigate to the smart-contracts folder
```bash
cd provenance/smart-contracts
```

#### 2. Install dependencies
```bash
npm install
```
#### 3. Create a .env file in the smart-contracts folder with
```env
PRIVATE_KEY=<your-private-key>
SEPOLIA_RPC_URL=<your-ethereum-rpc-url>
ETHERSCAN_API_KEY=<your-etherscan-api-key>
```
#### 4. Run the tests
```bash
npx hardhat test
```

#### 5. Deploy your own contract (example for Sepolia testnet)
```bash
npx hardhat ignition deploy ignition/modules/DeployProvenance.ts --network sepolia
```

---

## Demo Instructions

This project includes a Demo Role Faucet for a seamless testing experience.

* **1. Connect Your Wallet:** Open the application and click **"Connect Wallet"**. You will start as a Consumer.
* **2. Request a Demo Role:** Click **"Switch Role"** and select your desired role.

* **3. Choose a Role:**
  - **Become a Brand** – To access the product minting interface and manage retailers.
  - **Become a Retailer** – To access the inventory management dashboard.
  - **Become an Admin** – To access the governance dashboard and manage brands.
  - **Become a Consumer** – To access the product verification tool.
* **4. Explore:** After approving the transaction, the page will reload with your new interface.

---

## Sepolia Testnet ETH for Testing

To interact with the smart contracts on the Sepolia testnet, you will need Sepolia ETH in your MetaMask wallet. You can request free testnet ETH from the official Google Cloud Faucet:

**[Request Sepolia ETH](https://cloud.google.com/application/web3/faucet/ethereum/sepolia)**

> Note: You must have a Google account and provide your Sepolia wallet address.

---

## Deployed Contract Addresses (Sepolia Testnet)

| Contract          | Address	                                      | Etherscan Link|
|-------------------|-----------------------------------------------|---------------|
|**Provenance (Main)** |	`0x81eEB7A87E91f490FbcbFfCbd70793886aE83a59`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x81eEB7A87E91f490FbcbFfCbd70793886aE83a59) |
|**DemoRoleFaucet**	| `0x0442a21D30346d753664F5CB2fDee23C8D9689B5`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x0442a21D30346d753664F5CB2fDee23C8D9689B5) |
|**AdminFacet** |	`0xEab7bD1CB91DEB3ae9ae24055c8491BD44ca49e8`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0xEab7bD1CB91DEB3ae9ae24055c8491BD44ca49e8) |
|**BrandFacet** |	`0xeceCC6A0E111c259A956Ed5ADD79a85b7F5052d8`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0xeceCC6A0E111c259A956Ed5ADD79a85b7F5052d8) |
|**RetailerFacet** |	`0xfA749B3e946a03288a389AEDe1d5B4d0c1c02535`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0xfA749B3e946a03288a389AEDe1d5B4d0c1c02535) |
|**ConsumerFacet** |	`0x8BBCcE1a4bC66031B3a2204b381b2E17aF7A4cAB`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x8BBCcE1a4bC66031B3a2204b381b2E17aF7A4cAB) |
|**ERC721Facet** |	`0x28E56E64f3841AD06875AEF4CBa6D78Bc2ea7f76`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x28E56E64f3841AD06875AEF4CBa6D78Bc2ea7f76) |
|**AccessControlFacet** |	`0x4162174a021DAFcf7C3C8b85817C057237FDfF5b`	| [Sepolia Etherscan Link](https://sepolia.etherscan.io/address/0x4162174a021DAFcf7C3C8b85817C057237FDfF5b) |

