/**
 * @file grantFaucetAllRoles.ts
 * @description Script to grant all necessary roles (DEFAULT_ADMIN_ROLE, ADMIN_ROLE, BRAND_ROLE) 
 * to the DemoRoleFaucet contract for the fake product detection system demo functionality.
 * Verifies role assignments and provides comprehensive success/failure feedback.
 * 
 * @usage
 * 1. Set these environment variables in smart-contracts/.env:
 *    - SEPOLIA_RPC_URL=<your_sepolia_rpc_url>
 *    - PRIVATE_KEY=<admin_wallet_with_default_admin_role>
 *    - DIAMOND_ADDRESS=<deployed_diamond_contract_address>
 *    - FAUCET_ADDRESS=<deployed_faucet_contract_address>
 * 
 * 2. Execute the script:
 *    npx hardhat run scripts/grantFaucetAllRoles.ts --network sepolia
 */

import "dotenv/config";
import { ethers } from "ethers";

const ACCESS_CONTROL_ABI = [
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)"
];

const DEFAULT_ADMIN_ROLE = "0x0000000000000000000000000000000000000000000000000000000000000000";
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
const BRAND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRAND_ROLE"));

async function main() {
  const diamondAddress = process.env.DIAMOND_ADDRESS || "";
  const faucetAddress = process.env.FAUCET_ADDRESS || "";

  if (!ethers.isAddress(diamondAddress) || !ethers.isAddress(faucetAddress)) {
    throw new Error("Invalid DIAMOND_ADDRESS or FAUCET_ADDRESS in .env");
  }

  const rpcUrl = process.env.SEPOLIA_RPC_URL || "";
  const privateKey = process.env.PRIVATE_KEY || "";
  if (!rpcUrl || !privateKey) {
    throw new Error("Missing SEPOLIA_RPC_URL or PRIVATE_KEY in .env");
  }

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const adminSigner = new ethers.Wallet(privateKey, provider);
  const access = new ethers.Contract(diamondAddress, ACCESS_CONTROL_ABI, adminSigner);

  const hasDefaultAdmin = await access.hasRole(DEFAULT_ADMIN_ROLE, await adminSigner.getAddress());
  if (!hasDefaultAdmin) {
    throw new Error("Signer lacks DEFAULT_ADMIN_ROLE on diamond");
  }

  console.log("Granting all roles to DemoRoleFaucet...");

  console.log("Granting DEFAULT_ADMIN_ROLE to faucet...");
  const defaultAdminTx = await access.grantRole(DEFAULT_ADMIN_ROLE, faucetAddress);
  await defaultAdminTx.wait();

  const faucetHasDefaultAdmin = await access.hasRole(DEFAULT_ADMIN_ROLE, faucetAddress);
  if (!faucetHasDefaultAdmin) {
    throw new Error("Post-check failed: faucet missing DEFAULT_ADMIN_ROLE");
  }
  console.log("SUCCESS: Faucet granted DEFAULT_ADMIN_ROLE");

  console.log("Granting ADMIN_ROLE to faucet...");
  const adminTx = await access.grantRole(ADMIN_ROLE, faucetAddress);
  await adminTx.wait();

  const faucetHasAdminRole = await access.hasRole(ADMIN_ROLE, faucetAddress);
  if (!faucetHasAdminRole) {
    throw new Error("Post-check failed: faucet missing ADMIN_ROLE");
  }
  console.log("SUCCESS: Faucet granted ADMIN_ROLE");

  console.log("Granting BRAND_ROLE to faucet...");
  const brandTx = await access.grantRole(BRAND_ROLE, faucetAddress);
  await brandTx.wait();

  const faucetHasBrandRole = await access.hasRole(BRAND_ROLE, faucetAddress);
  if (!faucetHasBrandRole) {
    throw new Error("Post-check failed: faucet missing BRAND_ROLE");
  }
  console.log("SUCCESS: Faucet granted BRAND_ROLE");

  console.log("\n🎉 ALL ROLES GRANTED SUCCESSFULLY!");
  console.log("DemoRoleFaucet now has:");
  console.log("- DEFAULT_ADMIN_ROLE");
  console.log("- ADMIN_ROLE");
  console.log("- BRAND_ROLE");
  console.log("- RETAILER_ROLE (already had)");
}

main().catch((err) => {
  console.error("ERROR:", (err as Error)?.message || err);
  process.exit(1);
});
