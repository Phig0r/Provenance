/**
 * @file AdminPage.tsx
 * @description Admin dashboard for managing brand registrations and status updates.
 * Features brand onboarding forms, brand management tables, and status update modals.
 * Provides comprehensive admin controls for the fake product detection system.
 */

import { useState } from 'react';
import type { Signer } from 'ethers';

import Header from '../components/shared/Header';
import UpdateBrandStatus from '../components/admin/updateBrandStatus';
import { useAdminBrands } from '../hooks/useWeb3';
import { shortenAddress } from '../utils/formatter';
import type { BrandRow, ToastType } from '../types/types';

import styles from './AdminPage.module.css';

import AlertCircle from '../assets/icons/info.svg?react';
import Calendar from '../assets/icons/calendar.svg?react';
import Edit from '../assets/icons/edit.svg?react';
import Link from '../assets/icons/link.svg?react';
import Search from '../assets/icons/search.svg?react';
import Tag from "../assets/icons/hash.svg?react";
import Zap from "../assets/icons/zap.svg?react";
import Wallet from "../assets/icons/wallet.svg?react";

// Status Pill Component
const StatusPill = ({ status }: { status: string }) => (
  <div className={`${styles.statusPill} ${styles[status]}`}>
    <span className={styles.statusDot}></span>
    {status.charAt(0).toUpperCase() + status.slice(1)}
  </div>
);

interface AdminPageProps {
  onDisconnect?: () => void;
  signer: Signer | null;
  showToast: (message: string, type: ToastType, detail?: string) => void;
}

export default function AdminPage({ onDisconnect, signer, showToast }: AdminPageProps) {
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const { brands, isLoading, fetchBrands, registerBrand, updateBrandStatus } = useAdminBrands(signer);
  
  // Transaction Loading States
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  
  // Modal State Section
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<BrandRow | null>(null);

  // Initial Data Fetch Section
  if (!isLoading && brands.length === 0) {
    fetchBrands().catch(() => {});
  }

  // Modal Handlers Section
  const handleOpenModal = (brand: BrandRow) => {
    setSelectedBrand(brand);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBrand(null);
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedBrand || isUpdatingStatus) return;

    setIsUpdatingStatus(true);
    try {
      await updateBrandStatus(selectedBrand.wallet, newStatus as any, showToast);
    } catch (_) {
      showToast('Failed to update brand status.', 'error');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleRegisterBrand = async () => {
    if (isRegistering) return;

    setIsRegistering(true);
    try {
      await registerBrand(walletAddress, name, website, showToast);
    } catch (error) {
      showToast('Failed to register brand.', 'error');
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <>
      <Header userRole='admin' title="ADMIN DASHBOARD" onDisconnect={onDisconnect} signer={signer} showToast={showToast} />
      <main className={styles.mainContent}>
        
        {/* Brand Onboarding Section */}
        <div className={styles.leftColumn}>
          <div className={styles.leftCard}>
            <h2 className={styles.cardTitle}>Onboard a New Brand</h2>
            
            {/* Registration Form Section */}
            <form className={styles.onboardForm}>
              <div className={styles.formGroup}>
                <label htmlFor="name">NAME</label>
                <input id="name" type="text" placeholder="e.g., Apple" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="website">WEBSITE</label>
                <input id="website" type="text" placeholder="e.g., https://www.example.edu" value={website} onChange={(e) => setWebsite(e.target.value)} />
              </div>
              <div className={styles.formGroup}>
                <label htmlFor="walletAddress">WALLET ADDRESS</label>
                <input id="walletAddress" type="text" placeholder="e.g., 0xAbCd...1234" value={walletAddress} onChange={(e) => setWalletAddress(e.target.value)} />
              </div>
            </form>
            
            {/* Review Details Section */}
            <div className={styles.reviewDetails}>
              <h3 className={styles.reviewTitle}>Review Details</h3>
              <div className={styles.reviewGrid}>
                <div className={styles.reviewItem}>
                  <div><Tag /><span>Name</span></div>
                  <span className={`${styles.reviewValue} ${styles.fixedText} ${styles.fitText}`}>{name || '...'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <div><Link /><span>Website</span></div>
                  <span className={`${styles.reviewValue} ${styles.fixedText}`}>{website || '...'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <div><Wallet /><span>Wallet address</span></div>
                  <span className={styles.reviewValue}>{shortenAddress(walletAddress) || '...'}</span>
                </div>
                <div className={styles.reviewItem}>
                  <div><Zap /><span>Status</span></div>
                  <span className={styles.reviewValue}><StatusPill status="pending"/></span>
                </div>
              </div>
              <div className={styles.alert}>
                <AlertCircle />
                Please review all details for accuracy.
              </div>
            </div>
           
            <button 
              className={styles.registerButton} 
              onClick={handleRegisterBrand}
              disabled={isRegistering}
            >
              {isRegistering ? 'Registering...' : 'Register Brand'}
            </button>
          </div>
        </div>

        {/* Brand Management Section */}
        <div className={styles.rightColumn}>
          <div className={styles.rightCard}>
            <div className={styles.manageHeader}>
              <h2 className={styles.cardTitle}>Manage Brands</h2>
              <div className={styles.searchBar}>
                <Search className={styles.searchIcon} />
                <input type="text" placeholder="Search by name or address" />
              </div>
            </div>
            
            {/* Brands Table Section */}
            <table className={styles.brandsTable}>
              <thead>
                <tr>
                  <th><Tag className={styles.headerIcon}/> Name</th>
                  <th><Link className={styles.headerIcon}/> Website</th>
                  <th><Wallet className={styles.headerIcon}/> Wallet Address</th>
                  <th><Calendar className={styles.headerIcon}/> Registration Date</th>
                  <th><Zap className={styles.headerIcon}/> Status</th>
                  <th><Edit className={styles.headerIcon}/> Actions</th>
                </tr>
              </thead>
              <tbody>
                {(brands.length ? brands : []).map((brand, index) => (
                  <tr key={index}>
                    <td>{brand.name}</td>
                    <td><a href={brand.website}>Redirect</a></td>
                    <td title={brand.wallet}>{shortenAddress(brand.wallet)}</td>
                    <td>{brand.date}</td>
                    <td><StatusPill status={brand.status} /></td>
                    <td>
                      <button 
                        className={styles.updateButton} 
                        disabled={brand.status === 'revoked' || isUpdatingStatus}
                        onClick={() => handleOpenModal(brand)}
                      >
                        {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Status Update Modal Section */}
      {isModalOpen && selectedBrand && (
        <UpdateBrandStatus
          brandName={selectedBrand.name}
          currentStatus={selectedBrand.status}
          onClose={handleCloseModal}
          onUpdate={handleUpdateStatus}
        />
      )}
    </>
  );
}