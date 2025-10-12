/**
 * @file App.tsx
 * @description Main application component that handles routing and role-based access control.
 * Manages wallet connection, user role detection, and renders the appropriate page based on
 * the connected user's permissions (admin, brand, retailer, or consumer).
 */

import { useEffect, useState } from "react";
import { ethers } from 'ethers';

import LandingPage from './pages/LandingPage';
import AdminPage from './pages/AdminPage';
import BrandPage from './pages/BrandPage';
import RetailerPage from './pages/RetailerPage';
import ProductVerificationPage from './pages/ProductVerificationPage';
import Toast from './components/shared/Toast';

import { useWalletConnect, useContracts } from './hooks/useWeb3';
import type { UserRole } from './types/types';

// Role Constants
const ADMIN_ROLE = ethers.keccak256(ethers.toUtf8Bytes("ADMIN_ROLE"));
const BRAND_ROLE = ethers.keccak256(ethers.toUtf8Bytes("BRAND_ROLE"));
const RETAILER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("RETAILER_ROLE"));

function App() {
  const { walletAddress, signer, connectWallet, disconnectWallet, toast, closeToast, showToast } = useWalletConnect();
  const contracts = useContracts(signer);

  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role Detection Section
  useEffect(() => {
    const checkUserRole = async () => {
      if (!contracts?.accessControlFacet || !walletAddress) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        if (await contracts.accessControlFacet.hasRole(ADMIN_ROLE, walletAddress)) {
          showToast('Logging in...', 'info', 'Preparing Admin interface');
          await new Promise((r) => setTimeout(r, 3000));
          closeToast();
          setUserRole('admin');
        } else if (await contracts.accessControlFacet.hasRole(BRAND_ROLE, walletAddress)) {
          showToast('Logging in...', 'info', 'Preparing Brand interface');
          await new Promise((r) => setTimeout(r, 3000));
          closeToast();
          setUserRole('brand');
        } else if (await contracts.accessControlFacet.hasRole(RETAILER_ROLE, walletAddress)) {
          showToast('Logging in...', 'info', 'Preparing Retailer interface');
          await new Promise((r) => setTimeout(r, 3000));
          closeToast();
          setUserRole('retailer');
        } else {
          showToast('Logging in...', 'info', 'Preparing Consumer interface');
          await new Promise((r) => setTimeout(r, 3000));
          closeToast();
          setUserRole('consumer');
        }
      } catch (_) {
        showToast('Logging in...', 'info', 'Preparing Consumer interface');
        await new Promise((r) => setTimeout(r, 3000));
        closeToast();
        setUserRole('consumer'); 
      } finally {
        setIsLoading(false);
      }
    };

    checkUserRole();
  }, [contracts, walletAddress]);

  // Loading State Section
  if (isLoading) {
    return (
      <>
        <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
        <LandingPage onConnect={connectWallet} />
      </>
    );
  }

  // Unconnected State Section
  if (!walletAddress) {
    return (
      <>
        <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
        <LandingPage onConnect={connectWallet} />
      </>
    );
  }

  // Role-Based Routing Section
  switch (userRole) {
    case "admin":
      return (
        <>
          <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
          <AdminPage onDisconnect={disconnectWallet} signer={signer} showToast={showToast} />
        </>
      );
    case "brand":
      return (
        <>
          <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
          <BrandPage onDisconnect={disconnectWallet} signer={signer} showToast={showToast} />
        </>
      );
    case "retailer":
      return (
        <>
          <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
          <RetailerPage onDisconnect={disconnectWallet} signer={signer} showToast={showToast} />
        </>
      );
    case "consumer":
      return (
        <>
          <Toast show={toast.show} type={toast.type} message={toast.message} detail={toast.detail} onClose={closeToast} />
          <ProductVerificationPage onDisconnect={disconnectWallet} signer={signer} showToast={showToast} />
        </>
      );
    default:
      return <LandingPage onConnect={connectWallet} />;
  }
}

export default App;