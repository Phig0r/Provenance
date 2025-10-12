/**
 * @file BrandPage.tsx
 * @description The Brand dashboard for managing products, retailers, and returns.
 * It allows brands to mint new products, register retailers, initiate shipments,
 * and process incoming returns. The page dynamically displays brand status,
 * product inventory, and retailer network information.
 */

import { useState, useEffect } from 'react';
import type { Signer } from 'ethers';
import { ethers } from 'ethers';

import Header from "../components/shared/Header";
import UpdateRetailerStatus from '../components/brand/UpdateRetailerStatus';
import ProductInteractionManager from '../components/shared/ProductInteractionManager';
import ShipmentManager from '../components/shared/ShipmentManager';
import { useBrandOperations } from '../hooks/useWeb3';
import { shortenAddress } from '../utils/formatter';
import type { RetailerRow, ToastType, BrandStatus, RetailerStatus, ProductStatus } from '../types/types';

import styles from './BrandPage.module.css';

import AlertCircle from '../assets/icons/info.svg?react';
import Briefcase from '../assets/icons/briefcase.svg?react';
import Calendar from '../assets/icons/calendar.svg?react';
import Edit from '../assets/icons/edit.svg?react';
import Search from '../assets/icons/search.svg?react';
import Zap from '../assets/icons/zap.svg?react';
import Wallet from '../assets/icons/wallet.svg?react';

// Status Pill Component
const StatusPill = ({ status }: { status: BrandStatus | RetailerStatus | ProductStatus }) => (
  <div className={`${styles.statusPill} ${styles[status]}`}>
    <span className={styles.statusDot}></span>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </div>
);

interface BrandPageProps {
  onDisconnect?: () => void;
  signer: Signer | null;
  showToast: (message: string, type: ToastType, detail?: string) => void;
}

export default function BrandPage({ onDisconnect, signer, showToast }: BrandPageProps) {
  const { 
    brandProfile, brandStatus, returns, products, retailers, 
    mintProduct, registerRetailer, fetchBrandProducts, fetchBrandRetailers, 
    initiateShipment, fetchIncomingReturns, updateRetailerStatus, confirmReturnReceipt
  } = useBrandOperations(signer);

  // State Management Section
  const [activeTab, setActiveTab] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRetailer, setSelectedRetailer] = useState<RetailerRow | null>(null);

  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [productName, setProductName] = useState('');
  const [productAuthenticator, setProductAuthenticator] = useState('');
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);

  const [retailerName, setRetailerName] = useState('');
  const [retailerAddress, setRetailerAddress] = useState('');

  // Transaction Loading States
  const [isMinting, setIsMinting] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isInitiatingShipment, setIsInitiatingShipment] = useState(false);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
  const [isUpdatingRetailer, setIsUpdatingRetailer] = useState(false);

  // Effect Hooks Section
  useEffect(() => {
    if (brandProfile?.brandAddress && activeTab === 'all') {
      fetchBrandProducts();
    }
  }, [brandProfile?.brandAddress, activeTab, fetchBrandProducts]);

  useEffect(() => {
    if (brandProfile?.brandAddress && activeTab === 'retailers') {
      fetchBrandRetailers();
    }
  }, [brandProfile?.brandAddress, activeTab, fetchBrandRetailers]);

  useEffect(() => {
    if (activeTab === 'returns') {
      fetchIncomingReturns();
    }
  }, [activeTab, fetchIncomingReturns]);

  // Utility Functions Section
  const resetProductForm = () => {
    setProductName('');
    setProductAuthenticator('');
  };

  const resetRetailerForm = () => {
    setRetailerName('');
    setRetailerAddress('');
  };

  // Handlers Section
  const handleGenerateKey = async () => {
    if (brandStatus !== 'active') {
      showToast('Brand must be active to generate authenticator keys.', 'error');
      return;
    }

    setIsGeneratingKey(true);
    showToast('Generating authenticator keypair...', 'info', 'Creating PUF simulation keys');

    try {
      const wallet = ethers.Wallet.createRandom();
      const publicKey = wallet.address;
      const privateKey = wallet.privateKey;

      setProductAuthenticator(publicKey);

      const response = await fetch('http://localhost:3001/store-key', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brandName: brandProfile?.name || 'default',
          publicKey,
          privateKey
        })
      });

      if (response.ok) {
        showToast('Authenticator keypair generated and stored successfully!', 'success');
      } else {
        showToast('Failed to store keypair in database.', 'error');
      }
    } catch (_) {
      showToast('Failed to generate authenticator keypair.', 'error');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  const handleMintProduct = async () => {
    if (!productName || !productAuthenticator) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (isMinting) return; // Prevent multiple transactions

    setIsMinting(true);
    try {
      await mintProduct(productName, productAuthenticator, showToast, resetProductForm);
      fetchBrandProducts();
    } catch (_) {
      showToast('Failed to mint product.', 'error');
    } finally {
      setIsMinting(false);
    }
  };

  const handleRegisterRetailer = async () => {
    if (!retailerAddress || !retailerName) {
      showToast('Please fill in all required fields.', 'error');
      return;
    }

    if (isRegistering) return; // Prevent multiple transactions

    setIsRegistering(true);
    try {
      await registerRetailer(retailerAddress, retailerName, showToast, resetRetailerForm);
      fetchBrandRetailers();
    } catch (_) {
      showToast('Failed to register retailer.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleInitiateShipment = async (retailerAddress: string, tokenIds: number[], resetForm?: () => void) => {
    if (isInitiatingShipment) return; // Prevent multiple transactions

    setIsInitiatingShipment(true);
    try {
      await initiateShipment(retailerAddress, tokenIds, showToast, () => {
        fetchBrandProducts();
        if (resetForm) {
          resetForm();
        }
      });
    } catch (_) {
      showToast('Failed to initiate shipment.', 'error');
    } finally {
      setIsInitiatingShipment(false);
    }
  };

  const handleConfirmReturnReceipt = async (tokenIds: number[]) => {
    if (isConfirmingReturn) return; // Prevent multiple transactions

    setIsConfirmingReturn(true);
    try {
      await confirmReturnReceipt(tokenIds, showToast, () => {
        fetchIncomingReturns();
        fetchBrandProducts();
      });
    } catch (_) {
      showToast('Failed to confirm return receipt.', 'error');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  const handleOpenModal = (retailer: RetailerRow) => {
    setSelectedRetailer(retailer);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedRetailer(null);
  };

  const handleUpdateRetailerStatus = async (newStatus: string) => {
    if (!selectedRetailer || isUpdatingRetailer) return; // Prevent multiple transactions

    setIsUpdatingRetailer(true);
    try {
      await updateRetailerStatus(selectedRetailer.wallet, newStatus as any, showToast);
    } catch (_) {
      showToast('Failed to update retailer status.', 'error');
    } finally {
      setIsUpdatingRetailer(false);
    }
  };

  // Demo Status Detection - Show demo status when user has a role but no registered profile
  const isDemoRole = !brandProfile?.name ? 'demo' : undefined;
  const displayStatus = isDemoRole || brandStatus;

  // Status-based UI Logic
  const isDisabled = !brandProfile || brandStatus !== 'active';
  const statusMessage = isDemoRole
    ? 'You are currently viewing as a demo role. This is a demonstration interface.'
    : brandStatus === 'pending' 
    ? 'Your brand account is pending verification. Please wait for admin approval before proceeding.'
    : brandStatus === 'suspended' 
    ? 'Your brand account is suspended. Please contact admin for assistance.'
    : brandStatus === 'revoked'
    ? 'Your brand account has been revoked. Please contact admin for assistance.'
    : '';

  const headerTitle = brandProfile?.name 
    ? `${brandProfile.name.toUpperCase()} DASHBOARD`
    : 'BRAND DASHBOARD';

  return (
    <div className={styles.pageContainer}>
      <Header 
        userRole='brand' 
        title={headerTitle} 
        onDisconnect={onDisconnect} 
        signer={signer} 
        showToast={showToast}
        status={displayStatus as any}
      />
      <main className={styles.mainContent}>
        
        {/* Status Alert Section */}
        {statusMessage && (
          <div className={`${styles.alert} ${styles[isDemoRole || brandStatus as string]}`}>
            <AlertCircle />
            {statusMessage}
          </div>
        )}
        
        {/* --- Product Side --- */}
        <div className={styles.sectionWrapper}>
          <div className={`${styles.card} ${styles.mintProduct}`}>
            <h2 className={styles.cardTitle}>Mint a Product</h2>
            <form>
              <div className={styles.formGroup}>
                <label htmlFor="productName">NAME</label>
                <input 
                  id="productName" 
                  type="text" 
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g., iPhone 16 Pro" 
                  disabled={isDisabled}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="authenticator">PRODUCT AUTHENTICATOR</label>
                <input 
                  id="authenticator" 
                  type="text" 
                  value={productAuthenticator}
                  onChange={(e) => setProductAuthenticator(e.target.value)}
                  placeholder="Key will be generated here" 
                  disabled={true}
                />
                <button 
                  className={styles.generateButton}
                  onClick={handleGenerateKey}
                  disabled={isDisabled || isGeneratingKey || !!productAuthenticator}
                >
                  {isGeneratingKey ? 'Generating...' : 'Generate Authenticator'}
                </button>
              </div>
            </form>
            <div className={styles.alert}>
              <AlertCircle />
              Please review all details for accuracy.
            </div>
            <button 
              className={styles.actionButton}
              onClick={handleMintProduct}
              disabled={isDisabled || !productName || !productAuthenticator || isMinting}
            >
              {isMinting ? 'Minting...' : 'Mint'}
            </button>
          </div>

          <div className={`${styles.card} ${styles.manageProduct}`}>
            <div className={styles.manageHeader}>
              <h2 className={styles.cardTitle}>Manage Products</h2>
              <div className={styles.tabs}>
                <button 
                  className={`${styles.tabButton} ${activeTab === 'all' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All Products
                </button>
                <button 
                  className={`${styles.tabButton} ${activeTab === 'returns' ? styles.activeTab : ''}`}
                  onClick={() => setActiveTab('returns')}
                >
                  Incoming Returns
                </button>
              </div>
            </div>
            {activeTab === 'all' && (
              <div className={styles.interactionWrapper}>
                <ProductInteractionManager
                  viewType="brand"
                  products={products}
                  selectedProductIds={selectedProductIds}
                  onSelectionChange={setSelectedProductIds}
                  disabled={isDisabled}
                  isInitiatingShipment={isInitiatingShipment}
                  onInitiateShipment={handleInitiateShipment}
                />
              </div>
            )}
            {activeTab === 'returns' && (
              <div className={styles.interactionWrapper}>
                <ShipmentManager 
                  products={returns} 
                  viewType='returns' 
                  disabled={isDisabled}
                  isConfirmingReturn={isConfirmingReturn}
                  onReceive={handleConfirmReturnReceipt}
                />
              </div>
            )}
          </div>
        </div>
        
        {/* --- Retailer Side --- */}
        <div className={styles.sectionWrapper}>
           <div className={`${styles.card} ${styles.registerRetailer}`}>
            <h2 className={styles.cardTitle}>Register a Retailer</h2>
            <form>
              <div className={styles.formGroup}>
                <label htmlFor="retailerName">NAME</label>
                <input 
                  id="retailerName" 
                  type="text" 
                  value={retailerName}
                  onChange={(e) => setRetailerName(e.target.value)}
                  placeholder="e.g., Apple Store, Fifth Avenue" 
                  disabled={isDisabled}
                />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="retailerAddress">RETAILER ADDRESS</label>
                <input 
                  id="retailerAddress" 
                  type="text" 
                  value={retailerAddress}
                  onChange={(e) => setRetailerAddress(e.target.value)}
                  placeholder="e.g., 0x5E6F...g7h8" 
                  disabled={isDisabled}
                />
              </div>
            </form>
            <div className={styles.alert}>
              <AlertCircle />
              Please review all details for accuracy.
            </div>
            <button 
              className={styles.actionButton}
              onClick={handleRegisterRetailer}
              disabled={isDisabled || !retailerAddress || !retailerName || isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register'}
            </button>
          </div>

          <div className={`${styles.card} ${styles.manageRetailer}`}>
            <div className={styles.manageHeader}>
              <h2 className={styles.cardTitle}>Manage Retailers</h2>
              <div className={styles.controlsWrapper}>
                <div className={styles.searchBar}>
                  <Search className={styles.searchIcon} />
                  <input 
                    type="text" 
                    placeholder="Search by name or address"
                  />
                </div>
              </div>
            </div>
            <div className={styles.tableContainer}>
              <table className={styles.dataTable}>
                <thead>
                  <tr>
                    <th><Briefcase className={styles.headerIcon}/> Retailer</th>
                    <th><Wallet className={styles.headerIcon}/> Wallet Address</th>
                    <th><Calendar className={styles.headerIcon}/> Registration Date</th>
                    <th><Zap className={styles.headerIcon}/> Status</th>
                    <th><Edit className={styles.headerIcon}/> Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {retailers.map((retailer, index) => (
                    <tr key={index}>
                      <td>{retailer.name}</td>
                      <td>
                        <button 
                          className={styles.addressButton}
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(retailer.wallet);
                              showToast('Address copied to clipboard', 'success');
                            } catch (_) {
                              showToast('Failed to copy address', 'error');
                            }
                          }}
                          title={retailer.wallet}
                        >
                          {shortenAddress(retailer.wallet)}
                        </button>
                      </td>
                      <td>{retailer.date}</td>
                      <td><StatusPill status={retailer.status} /></td>
                      <td>
                        <button 
                          className={styles.updateButton}
                          onClick={() => handleOpenModal(retailer)}
                          disabled={isDisabled || retailer.status === 'terminated' || isUpdatingRetailer}
                        >
                          {isUpdatingRetailer ? 'Updating...' : 'Update Status'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </main>

      {isModalOpen && selectedRetailer && (
        <UpdateRetailerStatus
          retailerName={selectedRetailer.name}
          currentStatus={selectedRetailer.status}
          onClose={handleCloseModal}
          onUpdate={handleUpdateRetailerStatus}
        />
      )}
    </div>
  );
}