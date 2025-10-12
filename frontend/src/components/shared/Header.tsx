/**
 * @file Header.tsx
 * @description Shared header component displayed across all pages. Features logo, page title,
 * wallet address display, role switching functionality, and logout button. Includes status
 * indicators for brand/retailer accounts and integrates with the demo role switching system.
 */

import { useState } from 'react';

import Logo from '../../assets/icons/FPD-Logo.svg?react';
import SwitchRoleModal from './SwitchRoleModal';
import { useDemoRole } from '../../hooks/useWeb3';
import { shortenAddress } from '../../utils/formatter';
import type { HeaderProps, UserRole } from '../../types/types';

import styles from './Header.module.css';

export default function Header({ 
  title, 
  userRole, 
  onDisconnect, 
  signer, 
  showToast, 
  status 
}: HeaderProps) {
  const { isUpdating, changeRole } = useDemoRole(signer);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  // Wallet Address Resolution Section
  if (signer && !walletAddress) {
    signer.getAddress().then(setWalletAddress).catch(() => setWalletAddress(null));
  }

  // Role Switching Handler
  const handleConfirmSwitch = (newRole: UserRole) => {
    changeRole(newRole, showToast);
  };

  return (
    <>
      <header className={styles.headerContainer}>
        {/* Logo Section */}
        <div className={styles.logoWrapper}>
          <Logo className={styles.logoIcon} />
          <span className={styles.logoText}>
            Fake Product
            <br />
            Detection
          </span>
        </div>

        {/* Title Section */}
        <div className={styles.centerTitle}>
          <h1>
            {title}
            {status ? <span className={`${styles.statusDotIndicator} ${styles[status]}`}></span> : null}
          </h1>
        </div>

        {/* Wallet Section */}
        <div className={styles.walletWrapper}>
          <button
            onClick={() => setIsModalOpen(true)}
            className={styles.switchRoleButton}
            disabled={isUpdating}
          >
            {isUpdating ? 'Switching...' : 'Switch Role'}
          </button>

          <div className={styles.walletAddress}>
            <span>Wallet Address</span>
            <p>{shortenAddress(walletAddress)}</p>
          </div>
          <button className={styles.logoutButton} onClick={onDisconnect}>
            LOGOUT
          </button>
        </div>
      </header>

      {/* Role Switch Modal */}
      {isModalOpen && (
        <SwitchRoleModal
          currentRole={userRole}
          onClose={() => setIsModalOpen(false)}
          onConfirm={handleConfirmSwitch}
        />
      )}
    </>
  );
}