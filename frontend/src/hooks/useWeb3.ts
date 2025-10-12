/**
 * @file useWeb3.ts
 * @description Custom React hooks for Web3 integration and smart contract interactions.
 * Provides wallet connection, contract instances, role management, and business logic
 * for Admin, Brand, Retailer, and Consumer operations in the Provenance system.
 */

import { useMemo, useCallback, useState, useEffect } from "react";
import { ethers, type Signer } from "ethers";

import { wait, PROVENANCE_ADDRESS, DEMO_ROLE_FAUCET_ADDRESS } from "../utils/constants";

import { AdminFacetAbi } from "../utils/abi/AdminFacetAbi.json";
import { BrandFacetAbi } from "../utils/abi/BrandFacetAbi.json";
import { RetailerFacetAbi } from "../utils/abi/RetailerFacetAbi.json";
import { ConsumerFacetAbi } from "../utils/abi/ConsumerFacetAbi.json";
import { AccessControlFacetAbi } from "../utils/abi/AccessControlFacetAbi.json";
import { ERC721FacetAbi } from "../utils/abi/ERC721FacetAbi.json";
import { DemoRoleFaucetAbi } from "../utils/abi/DemoRoleFaucetAbi.json";

// Contract Instances Hook
export function useContracts(signer: Signer | null | undefined) {
    const contractInstances = useMemo(() => {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const contractRunner = signer ?? provider;

        if (!contractRunner) {
            return null;
        }

    const adminFacet = new ethers.Contract(PROVENANCE_ADDRESS, AdminFacetAbi, contractRunner);
    const brandFacet = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, contractRunner);
    const retailerFacet = new ethers.Contract(PROVENANCE_ADDRESS, RetailerFacetAbi, contractRunner);
    const consumerFacet = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, contractRunner);
    const accessControlFacet = new ethers.Contract(PROVENANCE_ADDRESS, AccessControlFacetAbi, contractRunner);
    const erc721Facet = new ethers.Contract(PROVENANCE_ADDRESS, ERC721FacetAbi, contractRunner);

        return {
            adminFacet,
            brandFacet,
            retailerFacet,
            consumerFacet,
            accessControlFacet,
            erc721Facet,
        };
    }, [signer]);

    return contractInstances;
}

// Wallet Connection Hook
export function useWalletConnect() {
   const [walletAddress, setWalletAddress] = useState<string | null>(null);
   const [signer, setSigner] = useState<Signer | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'info' | 'success' | 'error'; detail?: string }>({ 
    show: false, 
    message: '', 
    type: 'info' 
  });

  const showToast = (message: string, type: 'info' | 'success' | 'error', detail?: string) => 
    setToast({ show: true, message, type, detail });
   const closeToast = () => setToast((t) => ({ ...t, show: false }));

  const connectWallet = useCallback(async () => {
    try {
         showToast('Connecting to wallet...', 'info', 'Opening MetaMask to request permission');
         const provider = new ethers.BrowserProvider((window as any).ethereum);

         await provider.send("eth_requestAccounts", []);
         
         const currentSigner = await provider.getSigner();
      const currentWallet = await currentSigner.getAddress();

         setSigner(currentSigner);
         setWalletAddress(currentWallet);
         await wait(3000);
         closeToast();
    } catch (_) {
         showToast('Failed to connect wallet', 'error');
      }
  }, []);

  const disconnectWallet = async () => {
      showToast("Disconnecting wallet...", 'info', 'Clearing session and returning to landing page');
      await wait(3000);
      closeToast();
      setSigner(null);
      setWalletAddress(null);
  };

  return { signer, walletAddress, connectWallet, disconnectWallet, toast, closeToast, showToast };
}

// Demo Role Management Hook
type DemoUserRole = 'admin' | 'brand' | 'retailer' | 'consumer';
type DemoToastType = 'info' | 'success' | 'error';

export function useDemoRole(signer: Signer | null) {
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const faucetContract = useMemo(() => {
    if (!signer) return null;
    try {
      return new ethers.Contract(DEMO_ROLE_FAUCET_ADDRESS, DemoRoleFaucetAbi, signer);
    } catch {
      return null;
    }
  }, [signer]);

  const changeRole = useCallback(async (
    role: DemoUserRole,
    showToast: (message: string, type: DemoToastType, detail?: string) => void
  ) => {
    if (!faucetContract) {
      showToast("Please connect your wallet first.", "error");
      return;
    }

    setIsUpdating(true);
    showToast("Preparing transaction...", "info", "Requesting role update");

    try {
      let tx;
      if (role === 'admin') {
        tx = await faucetContract.requestAdminRoleRole();
      } else if (role === 'brand') {
        tx = await faucetContract.requestBrandRole();
      } else if (role === 'retailer') {
        tx = await faucetContract.requestRetailerRole();
      } else {
        tx = await faucetContract.revokeAllMyRoles();
      }

      showToast("Waiting for transaction confirmation...", "info", "Your transaction is pending on-chain");
      await tx.wait();
      showToast("Role updated successfully! Reloading...", "success");

      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error: any) {
      const errorMessage = error?.reason || error?.message || "Transaction failed or was rejected.";
      showToast(errorMessage, "error");
    } finally {
      setIsUpdating(false);
    }
  }, [faucetContract]);

  return { isUpdating, changeRole };
}

// Admin Operations Hook
type BrandRow = { 
  name: string; 
  website: string; 
  wallet: string; 
  date: string; 
  status: 'active' | 'suspended' | 'revoked' | 'pending' 
};

export function useAdminBrands(signer: Signer | null) {
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const mapStatus = (status: bigint | number): BrandRow['status'] => {
    const s = typeof status === 'bigint' ? Number(status) : status;
    switch (s) {
      case 1: return 'active';
      case 2: return 'suspended';
      case 3: return 'revoked';
      case 0:
      default: return 'pending';
    }
  };

  const fetchBrands = useCallback(async () => {
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readAdmin = new ethers.Contract(PROVENANCE_ADDRESS, AdminFacetAbi, provider);

      const topic0 = ethers.id("BrandRegistered(address,string,uint256)");
      const logs = await provider.getLogs({ 
        address: PROVENANCE_ADDRESS, 
        topics: [topic0], 
        fromBlock: 0n, 
        toBlock: 'latest' 
      });

      const iface = new ethers.Interface(AdminFacetAbi);
      const seen = new Set<string>();
      const addresses: string[] = [];
      
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (!parsed) continue;
          const brandAddr: string = parsed.args?.[0] as string;
          if (brandAddr && !seen.has(brandAddr)) { 
            seen.add(brandAddr); 
            addresses.push(brandAddr); 
          }
        } catch { /* skip */ }
      }

      const rows: BrandRow[] = [];
      for (const addr of addresses) {
        try {
          const profile = await readAdmin.getBrandProfile(addr);
          const date = new Date(Number(profile.registrationTimestamp) * 1000).toLocaleDateString();
          rows.push({
            name: profile.name as string,
            website: profile.website as string,
            wallet: addr,
            date,
            status: mapStatus(profile.status as bigint),
          });
        } catch { /* ignore missing */ }
      }

      setBrands(rows);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const registerBrand = useCallback(async (
    brandAddress: string,
    name: string,
    website: string,
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeAdmin = new ethers.Contract(PROVENANCE_ADDRESS, AdminFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Registering brand');
      const tx = await writeAdmin.registerBrand(brandAddress, name, website);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Brand registered successfully', 'success');
      await fetchBrands();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer, fetchBrands]);

  const updateBrandStatus = useCallback(async (
    brandAddress: string,
    newStatus: BrandRow['status'],
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeAdmin = new ethers.Contract(PROVENANCE_ADDRESS, AdminFacetAbi, signer);
      const toEnum = (s: BrandRow['status']) => s === 'active' ? 1 : s === 'suspended' ? 2 : s === 'revoked' ? 3 : 0;
      showToast('Preparing transaction...', 'info', 'Updating brand status');
      const tx = await writeAdmin.updateBrandStatus(brandAddress, toEnum(newStatus));
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Brand status updated', 'success');
      await fetchBrands();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer, fetchBrands]);

  return { brands, isLoading, fetchBrands, registerBrand, updateBrandStatus };
}

// Brand Operations Hook
export function useBrandOperations(signer: Signer | null) {
  const [brandProfile, setBrandProfile] = useState<{ 
    name: string; 
    website: string; 
    status: number; 
    registrationTimestamp: bigint; 
    brandAddress: string 
  } | null>(null);
  const [returns, setReturns] = useState<any[]>([]);
  const [retailers, setRetailers] = useState<Array<{ 
    name: string; 
    wallet: string; 
    date: string; 
    status: 'active' | 'suspended' | 'terminated' 
  }>>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Status Mapping Functions
  const mapStatus = (status: number) => {
    switch (status) {
      case 1: return 'active';
      case 2: return 'suspended';
      case 3: return 'revoked';
      case 0:
      default: return 'pending';
    }
  };

  const mapRetailerStatus = (status: number): 'active' | 'suspended' | 'terminated' => {
    switch (status) {
      case 0: return 'active';
      case 1: return 'suspended';
      case 2: return 'terminated';
      default: return 'active';
    }
  };

  // Brand Profile Management
  const fetchBrandProfile = useCallback(async () => {
    if (!signer) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readAdmin = new ethers.Contract(PROVENANCE_ADDRESS, AdminFacetAbi, provider);
      const profile = await readAdmin.getBrandProfile(await signer.getAddress());
      setBrandProfile(profile);
    } catch (_) {
      setBrandProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Effect Hooks for Data Loading
  useEffect(() => {
    if (signer && !brandProfile) {
      fetchBrandProfile().catch(() => {});
    }
  }, [signer, brandProfile, fetchBrandProfile]);

  useEffect(() => {
    if (brandProfile && returns.length === 0) {
      fetchIncomingReturns().catch(() => {});
    }
  }, [brandProfile, returns.length]);

  useEffect(() => {
    if (brandProfile && products.length === 0) {
      fetchBrandProducts().catch(() => {});
    }
  }, [brandProfile, products.length]);

  useEffect(() => {
    if (brandProfile && retailers.length === 0) {
      fetchBrandRetailers().catch(() => {});
    }
  }, [brandProfile, retailers.length]);

  // Data Fetching Functions
  const fetchIncomingReturns = useCallback(async () => {
    if (!brandProfile) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readConsumer = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, provider);
      const readErc721 = new ethers.Contract(PROVENANCE_ADDRESS, ERC721FacetAbi, provider);

      const topic0 = ethers.id("ShipmentReturned(address,address,uint256[],uint256)");
      const brandTopic = ethers.zeroPadValue(brandProfile.brandAddress, 32);
      const filter = { address: PROVENANCE_ADDRESS, topics: [topic0, null, brandTopic] } as any;
      const logs = await provider.getLogs({ ...filter, fromBlock: 0n, toBlock: 'latest' });

      const iface = new ethers.Interface(BrandFacetAbi);
      const tokenIds: bigint[] = [];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed) tokenIds.push(...(parsed.args?.[2] as bigint[] | undefined || []));
        } catch { /* skip */ }
      }

      // Remove duplicate token IDs
      const uniqueTokenIds = [...new Set(tokenIds.map(id => id.toString()))].map(id => BigInt(id));

      const returnsData: any[] = [];
      for (const tokenId of uniqueTokenIds) {
        try {
          const product = await readConsumer.getProductDetails(tokenId);
          const currentStatus = mapProductStatus(Number(product.status));
          
          // Check ownership - only include products owned by the brand
          let owner: string | null = null;
          try {
            owner = await readErc721.ownerOf(tokenId);
          } catch { owner = null; }
          
          // Only include products that are InTransit AND owned by the brand
          if (currentStatus === 'inTransit' && owner === brandProfile.brandAddress) {
            returnsData.push({
              id: Number(tokenId),
              name: product.name as string,
              status: currentStatus,
              mintDate: new Date(Number(product.mintTimestamp) * 1000).toLocaleDateString(),
              brandAddress: product.brandAddress as string
            });
          }
        } catch { /* skip if not found */ }
      }

      setReturns(returnsData);
    } catch (_) {
      setReturns([]);
    } finally {
      setIsLoading(false);
    }
  }, [brandProfile]);

  const fetchBrandProducts = useCallback(async () => {
    if (!brandProfile) return [];
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readConsumer = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, provider);
      const readErc721 = new ethers.Contract(PROVENANCE_ADDRESS, ERC721FacetAbi, provider);

      // Get ProductMinted(address indexed brand, uint256 indexed tokenId, ...)
      const topic0 = ethers.id("ProductMinted(address,uint256,string,address,uint256)");
      const brandTopic = ethers.zeroPadValue(brandProfile.brandAddress, 32);
      const filter = { address: PROVENANCE_ADDRESS, topics: [topic0, brandTopic] };
      const logs = await provider.getLogs({ ...filter, fromBlock: 0n, toBlock: 'latest' });

      const iface = new ethers.Interface(BrandFacetAbi);
      const tokenIds: bigint[] = [];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed) tokenIds.push(parsed.args?.[1] as bigint); // tokenId is indexed, second arg
        } catch { /* skip */ }
      }

      const productsData: any[] = [];
      for (const tokenId of tokenIds) {
        try {
          const product = await readConsumer.getProductDetails(tokenId);
          let owner: string | null = null;
          try {
            owner = await readErc721.ownerOf(tokenId);
          } catch { owner = null; }
          productsData.push({
            id: Number(tokenId),
            name: product.name as string,
            status: mapProductStatus(Number(product.status)),
            mintDate: new Date(Number(product.mintTimestamp) * 1000).toLocaleDateString(),
            brandAddress: product.brandAddress as string,
            productAuthenticator: product.productAuthenticator as string,
            saleTimestamp: product.saleTimestamp ? new Date(Number(product.saleTimestamp) * 1000).toLocaleDateString() : null,
            owner,
          });
        } catch { /* skip if not found */ }
      }

      setProducts(productsData);
      return productsData;
    } catch (err) {
      console.error('Failed to fetch brand products:', err);
      setProducts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [brandProfile]);

  const fetchBrandRetailers = useCallback(async () => {
    if (!brandProfile) return [];
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, provider);

      // RetailerRegistered(address indexed brand, address indexed retailer, string name, uint256 timestamp)
      const topic0 = ethers.id("RetailerRegistered(address,address,string,uint256)");
      const brandTopic = ethers.zeroPadValue(brandProfile.brandAddress, 32);
      const filter = { address: PROVENANCE_ADDRESS, topics: [topic0, brandTopic] };
      const logs = await provider.getLogs({ ...filter, fromBlock: 0n, toBlock: 'latest' });

      const retailerAddresses: string[] = [];
      for (const log of logs) {
        try {
          // topics[2] should be indexed retailer address
          // We can directly parse the address from the topic without relying on parsed.topics
          const retailerTopic = log.topics?.[2];
          if (retailerTopic && retailerTopic.length === 66) {
            const retailerAddr = ethers.getAddress('0x' + retailerTopic.slice(26));
            retailerAddresses.push(retailerAddr);
          }
        } catch { /* skip */ }
      }

      // Deduplicate
      const uniqueRetailers = Array.from(new Set(retailerAddresses));

      const list: Array<{ name: string; wallet: string; date: string; status: 'active' | 'suspended' | 'terminated' }> = [];
      for (const addr of uniqueRetailers) {
        try {
          const profile = await readBrand.getRetailerProfile(addr);
          list.push({
            name: profile.name as string,
            wallet: addr,
            date: new Date(Number(profile.onboardingTimestamp) * 1000).toLocaleDateString(),
            status: mapRetailerStatus(Number(profile.status)),
          });
        } catch { /* skip */ }
      }

      setRetailers(list);
      return list;
    } catch (err) {
      console.error('Failed to fetch retailers:', err);
      setRetailers([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [brandProfile]);

  // Product Status Mapping
  const mapProductStatus = (status: number) => {
    switch (status) {
      case 0: return 'inFactory';
      case 1: return 'inTransit';
      case 2: return 'inRetailer';
      case 3: return 'sold';
      default: return 'unknown';
    }
  };

  // Product Management Functions
  const mintProduct = useCallback(async (
    name: string,
    productAuthenticator: string,
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Minting product');
      const tx = await writeBrand.mintProduct(name, productAuthenticator);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Product minted successfully', 'success');

      // Reset form and refetch products after successful mint
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer]);

  // Error Handling Utilities
  const decodeCustomError = (errorData: string): string => {
    const errorMap: { [key: string]: string } = {
      '0x1d48edd0': 'One or more products are not in the correct status for shipment. Only products with "In Factory" status can be shipped.',
      '0xbb5afbe2': 'Retailer not found. Please verify the retailer address is correct and registered.',
      '0x8c379a00': 'Cannot ship to this retailer. The retailer account is not active (suspended or terminated).',
    };
    
    if (errorMap[errorData]) {
      return errorMap[errorData];
    }
    
    if (errorData.includes('ProvenanceRetailerNotActive')) {
      return 'Cannot ship to this retailer. The retailer account is not active (suspended or terminated).';
    }
    if (errorData.includes('ProvenanceRetailerNotFound')) {
      return 'Retailer not found. Please verify the retailer address is correct and registered.';
    }
    if (errorData.includes('ProvenanceInvalidProductStatus')) {
      return 'One or more products are not in the correct status for shipment. Only products with "In Factory" status can be shipped.';
    }
    if (errorData.includes('ProvenanceBrandNotActive')) {
      return 'Your brand account is not active. Please contact admin to activate your account.';
    }
    if (errorData.includes('AccessControlUnauthorizedAccount')) {
      return 'You do not have permission to perform this action.';
    }
    
    return 'Transaction failed. Please check your inputs and try again.';
  };

  const initiateShipment = useCallback(async (
    retailerAddress: string,
    tokenIds: number[],
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, signer);
      showToast('Preparing shipment...', 'info', 'Initiating shipment to retailer');
      const tx = await writeBrand.initiateShipment(tokenIds, retailerAddress);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Shipment initiated successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      let msg = 'Transaction failed. Please try again.';
      
      // Handle different error types
      if (err?.code === 'CALL_EXCEPTION') {
        if (err?.data) {
          msg = decodeCustomError(err.data);
        } else if (err?.reason) {
          msg = err.reason;
        }
      } else if (err?.message) {
        // Handle user rejection or network errors
        if (err.message.includes('user rejected')) {
          msg = 'Transaction was cancelled by user.';
        } else if (err.message.includes('insufficient funds')) {
          msg = 'Insufficient funds for gas fees.';
        } else {
          msg = err.message;
        }
      }
      
      showToast(msg, 'error');
    }
  }, [signer]);

  const registerRetailer = useCallback(async (
    retailerAddress: string,
    name: string,
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Registering retailer');
      const tx = await writeBrand.registerRetailer(retailerAddress, name);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Retailer registered successfully', 'success');
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      let msg = 'Transaction failed. Please try again.';
      
      if (err?.code === 'CALL_EXCEPTION') {
        if (err?.data) {
          msg = decodeCustomError(err.data);
        } else if (err?.reason) {
          msg = err.reason;
        }
      } else if (err?.message) {
        if (err.message.includes('user rejected')) {
          msg = 'Transaction was cancelled by user.';
        } else if (err.message.includes('insufficient funds')) {
          msg = 'Insufficient funds for gas fees.';
        } else {
          msg = err.message;
        }
      }
      
      showToast(msg, 'error');
    }
  }, [signer]);

  const updateRetailerStatus = useCallback(async (
    retailerAddress: string,
    newStatus: 'active' | 'suspended' | 'terminated',
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, signer);
      const toEnum = (s: 'active' | 'suspended' | 'terminated') => s === 'active' ? 0 : s === 'suspended' ? 1 : 2;
      showToast('Preparing transaction...', 'info', 'Updating retailer status');
      const tx = await writeBrand.updateRetailerStatus(retailerAddress, toEnum(newStatus));
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Retailer status updated', 'success');
    } catch (err: any) {
      let msg = 'Transaction failed. Please try again.';
      
      if (err?.code === 'CALL_EXCEPTION') {
        if (err?.data) {
          msg = decodeCustomError(err.data);
        } else if (err?.reason) {
          msg = err.reason;
        }
      } else if (err?.message) {
        if (err.message.includes('user rejected')) {
          msg = 'Transaction was cancelled by user.';
        } else if (err.message.includes('insufficient funds')) {
          msg = 'Insufficient funds for gas fees.';
        } else {
          msg = err.message;
        }
      }
      
      showToast(msg, 'error');
    }
  }, [signer]);

  const confirmReturnReceipt = useCallback(async (
    tokenIds: number[],
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Confirming return receipt');
      const tx = await writeBrand.confirmReturnReceipt(tokenIds);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Return receipt confirmed', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer]);

  // PUF Key Generation
  const generateAuthenticatorKeypair = useCallback(async (
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: (publicKey: string, privateKey: string) => void
  ) => {
    try {
      const wallet = ethers.Wallet.createRandom();
      const publicKey = wallet.address;
      const privateKey = wallet.privateKey;
      
      showToast('Keypair generated successfully', 'success');
      if (onSuccess) onSuccess(publicKey, privateKey);
    } catch (err: any) {
      showToast('Failed to generate keypair', 'error');
    }
  }, []);

  return {
    brandProfile,
    brandStatus: brandProfile ? mapStatus(Number(brandProfile.status)) : null,
    returns,
    retailers,
    products,
    isLoading,
    fetchBrandProfile,
    fetchIncomingReturns,
    fetchBrandRetailers,
    fetchBrandProducts,
    mintProduct,
    initiateShipment,
    registerRetailer,
    updateRetailerStatus,
    confirmReturnReceipt,
    generateAuthenticatorKeypair
  };
}

// Retailer Operations Hook
export function useRetailerOperations(signer: Signer | null) {
  const [retailerProfile, setRetailerProfile] = useState<{ 
    name: string; 
    brandAddress: string; 
    onboardingTimestamp: bigint; 
    status: number 
  } | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [retailerSoldTokenIds, setRetailerSoldTokenIds] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Status Mapping Functions
  const mapRetailerStatus = (status: number): 'active' | 'suspended' | 'terminated' => {
    switch (status) {
      case 0: return 'active';
      case 1: return 'suspended';
      case 2: return 'terminated';
      default: return 'active';
    }
  };

  const mapProductStatus = (status: number) => {
    switch (status) {
      case 0: return 'inFactory';
      case 1: return 'inTransit';
      case 2: return 'inRetailer';
      case 3: return 'sold';
      default: return 'unknown';
    }
  };

  // Profile Management
  const fetchRetailerProfile = useCallback(async () => {
    if (!signer) return;
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readBrand = new ethers.Contract(PROVENANCE_ADDRESS, BrandFacetAbi, provider);
      const profile = await readBrand.getRetailerProfile(await signer.getAddress());
      setRetailerProfile(profile);
    } catch {
      setRetailerProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  // Effect Hooks
  useEffect(() => {
    if (signer && !retailerProfile) {
      fetchRetailerProfile().catch(() => {});
    }
  }, [signer, retailerProfile, fetchRetailerProfile]);

  // Data Fetching Functions
  const fetchRetailerSoldTokens = useCallback(async () => {
    if (!signer) return [];
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const topic0 = ethers.id("ProductSold(address,address,uint256,uint256)");
      const retailerAddress = await signer.getAddress();
      const retailerTopic = ethers.zeroPadValue(retailerAddress, 32);
      const filter = { address: PROVENANCE_ADDRESS, topics: [topic0, null, retailerTopic] } as any;
      const logs = await provider.getLogs({ ...filter, fromBlock: 0n, toBlock: 'latest' });
      const sold: number[] = [];
      for (const l of logs) {
        const tokenTopic = l.topics?.[3];
        if (tokenTopic && tokenTopic.length === 66) {
          sold.push(Number(BigInt(tokenTopic)));
        }
      }
      setRetailerSoldTokenIds(sold);
      return sold;
    } catch (_) {
      setRetailerSoldTokenIds([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [signer]);

  const fetchRetailerProducts = useCallback(async () => {
    if (!retailerProfile || !signer) return [];
    setIsLoading(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const readConsumer = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, provider);
      const readErc721 = new ethers.Contract(PROVENANCE_ADDRESS, ERC721FacetAbi, provider);

      const topic0 = ethers.id("ProductMinted(address,uint256,string,address,uint256)");
      const brandTopic = ethers.zeroPadValue(retailerProfile.brandAddress, 32);
      const filter = { address: PROVENANCE_ADDRESS, topics: [topic0, brandTopic] };
      const logs = await provider.getLogs({ ...filter, fromBlock: 0n, toBlock: 'latest' });

      const iface = new ethers.Interface(BrandFacetAbi);
      const tokenIds: bigint[] = [];
      for (const log of logs) {
        try {
          const parsed = iface.parseLog({ topics: log.topics as string[], data: log.data });
          if (parsed) tokenIds.push(parsed.args?.[1] as bigint);
        } catch { /* skip */ }
      }

      const myAddress = await signer.getAddress();
      const soldTokens = await fetchRetailerSoldTokens();

      const productsData: any[] = [];
      for (const tokenId of tokenIds) {
        try {
          const product = await readConsumer.getProductDetails(tokenId);
          let owner: string | null = null;
          try { owner = await readErc721.ownerOf(tokenId); } catch { owner = null; }

          const include = (owner && owner.toLowerCase() === myAddress.toLowerCase()) || soldTokens.includes(Number(tokenId));
          if (!include) continue;

          productsData.push({
            id: Number(tokenId),
            name: product.name as string,
            status: mapProductStatus(Number(product.status)),
            mintDate: new Date(Number(product.mintTimestamp) * 1000).toLocaleDateString(),
            brandAddress: product.brandAddress as string,
            productAuthenticator: product.productAuthenticator as string,
            saleTimestamp: product.saleTimestamp ? new Date(Number(product.saleTimestamp) * 1000).toLocaleDateString() : null,
            owner,
          });
        } catch { /* skip */ }
      }

      setProducts(productsData);
      return productsData;
    } catch (err) {
      console.error('Failed to fetch retailer products:', err);
      setProducts([]);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [retailerProfile, signer, fetchRetailerSoldTokens]);

  // Transaction Functions
  const receiveShipment = useCallback(async (
    tokenIds: number[],
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeRetailer = new ethers.Contract(PROVENANCE_ADDRESS, RetailerFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Confirming shipment receipt');
      const tx = await writeRetailer.receiveProductShipment(tokenIds);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Shipment received successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer]);

  const returnProducts = useCallback(async (
    tokenIds: number[],
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeRetailer = new ethers.Contract(PROVENANCE_ADDRESS, RetailerFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Returning selected products to brand');
      const tx = await writeRetailer.returnProducts(tokenIds);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Products returned successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer]);

  const finalizeSale = useCallback(async (
    tokenId: number,
    consumer: string,
    showToast: (message: string, type: 'info' | 'success' | 'error', detail?: string) => void,
    onSuccess?: () => void
  ) => {
    if (!signer) {
      showToast('Please connect your wallet first.', 'error');
      return;
    }
    try {
      const writeRetailer = new ethers.Contract(PROVENANCE_ADDRESS, RetailerFacetAbi, signer);
      showToast('Preparing transaction...', 'info', 'Finalizing sale');
      const tx = await writeRetailer.finalizeSale(tokenId, consumer);
      showToast('Waiting for confirmation...', 'info', 'Your transaction is pending on-chain');
      await tx.wait();
      showToast('Sale finalized successfully', 'success');
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err?.reason || err?.message || 'Transaction failed or was rejected.';
      showToast(msg, 'error');
    }
  }, [signer]);

  // Effect Hooks for Data Loading
  useEffect(() => {
    if (retailerProfile) {
      fetchRetailerProducts().catch(() => {});
    }
  }, [retailerProfile, fetchRetailerProducts]);

  return {
    retailerProfile,
    retailerStatus: retailerProfile ? mapRetailerStatus(Number(retailerProfile.status)) : null,
    products,
    retailerSoldTokenIds,
    isLoading,
    fetchRetailerProfile,
    fetchRetailerProducts,
    fetchRetailerSoldTokens,
    returnProducts,
    finalizeSale,
    receiveShipment,
  };
}

// Consumer Operations Hook
export function useConsumerOperations(signer: Signer | null) {
  const getProductDetails = useCallback(async (productId: string) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const consumerContract = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, provider);
      const productDetails = await consumerContract.getProductDetails(productId);
      return {
        name: productDetails.name,
        brandAddress: productDetails.brandAddress,
        productAuthenticator: productDetails.productAuthenticator,
        mintTimestamp: productDetails.mintTimestamp
      };
    } catch (error: any) {
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error?.code === 'CALL_EXCEPTION') {
        if (error?.data?.includes('ProvenanceProductNotFound')) {
          throw new Error('Product not found');
        } else {
          throw new Error('Blockchain connection error. Please try again later.');
        }
      } else {
        throw new Error('Product not found');
      }
    }
  }, []);

  const verifyProduct = useCallback(async (
    productId: string,
    challenge: number,
    signature: string
  ) => {
    if (!signer) {
      throw new Error('Please connect your wallet first');
    }
    
    const consumerContract = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, signer);
    const tx = await consumerContract.consumeVerification(productId, challenge, signature);
    await tx.wait();
    return tx;
  }, [signer]);

  const checkNonceUsed = useCallback(async (productId: string, challenge: number) => {
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const consumerContract = new ethers.Contract(PROVENANCE_ADDRESS, ConsumerFacetAbi, provider);
      const isNonceUsed = await consumerContract.isNonceAlreadyUsed(productId, challenge);
      return isNonceUsed;
    } catch (error: any) {
      if (error?.code === 'NETWORK_ERROR' || error?.message?.includes('network')) {
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error?.code === 'CALL_EXCEPTION') {
        throw new Error('Blockchain connection error. Please try again later.');
      } else {
        throw new Error('Failed to check nonce usage. Please try again.');
      }
    }
  }, []);

  return { getProductDetails, verifyProduct, checkNonceUsed };
}