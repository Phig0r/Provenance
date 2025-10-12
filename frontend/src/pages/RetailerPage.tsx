/**
 * @file RetailerPage.tsx
 * @description Retailer dashboard for managing product sales, returns, and incoming shipments.
 * Features product inventory management, sales finalization, return processing, and shipment
 * receiving. Provides comprehensive retailer controls for the fake product detection system.
 */

import { useMemo, useState } from 'react';
import type { Signer } from 'ethers';

import Header from '../components/shared/Header';
import ProductInteractionManager from '../components/shared/ProductInteractionManager';
import ShipmentManager from '../components/shared/ShipmentManager';
import { useRetailerOperations } from '../hooks/useWeb3';
import type { Product, StatCardProps, ToastType } from '../types/types';

import styles from './RetailerPage.module.css';

import Archive from '../assets/icons/package.svg?react';
import CheckCircle from '../assets/icons/check-circle.svg?react';
import Truck from '../assets/icons/truck.svg?react';
import AlertCircle from '../assets/icons/alert-circle.svg?react';

// Stat Card Component
function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statContent}>
        <p className={styles.statTitle}>{title}</p>
        <h3 className={styles.statValue}>{value}</h3>
        {icon}
      </div>
    </div>
  );
}

interface RetailerPageProps {
  onDisconnect?: () => void;
  signer: Signer | null;
  showToast: (message: string, type: ToastType, detail?: string) => void;
}

export default function RetailerPage({ onDisconnect, signer, showToast }: RetailerPageProps) {
  const { 
    retailerProfile, 
    retailerStatus, 
    products, 
    fetchRetailerProducts, 
    receiveShipment, 
    returnProducts, 
    finalizeSale 
  } = useRetailerOperations(signer);
  
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Transaction Loading States
  const [isReturningProducts, setIsReturningProducts] = useState(false);
  const [isFinalizingSale, setIsFinalizingSale] = useState(false);
  const [isReceivingShipment, setIsReceivingShipment] = useState(false);

  // Product Classification Section
  const { sellPanelProducts, incomingShipments, totalSold } = useMemo(() => {
    const sell: Product[] = [];
    const incoming: Product[] = [];
    let soldCount = 0;

    for (const p of products as Product[]) {
      if (p.status === 'sold') {
        soldCount += 1;
      }
      if (p.status === 'inRetailer' || p.status === 'sold') {
        sell.push(p);
      } else if (p.status === 'inTransit') {
        incoming.push(p);
      }
    }

    return { sellPanelProducts: sell, incomingShipments: incoming, totalSold: soldCount };
  }, [products]);

  // Action Handlers Section
  const handleReturnProducts = async (ids: number[]) => {
    if (isReturningProducts) return;

    setIsReturningProducts(true);
    try {
      await returnProducts(ids, showToast, async () => {
        await fetchRetailerProducts();
        setSelectedProductIds([]);
      });
    } catch (_) {
      showToast('Failed to return products.', 'error');
    } finally {
      setIsReturningProducts(false);
    }
  };

  const handleFinalizeSale = async (pid: number, consumer: string) => {
    if (isFinalizingSale) return;

    setIsFinalizingSale(true);
    try {
      await finalizeSale(pid, consumer, showToast, async () => {
        await fetchRetailerProducts();
        setSelectedProductIds(prev => prev.filter(id => id !== pid));
      });
    } catch (_) {
      showToast('Failed to finalize sale.', 'error');
    } finally {
      setIsFinalizingSale(false);
    }
  };

  const handleReceiveShipment = async (ids: number[]) => {
    if (isReceivingShipment) return;

    setIsReceivingShipment(true);
    try {
      await receiveShipment(ids, showToast, async () => {
        await fetchRetailerProducts();
      });
    } catch (_) {
      showToast('Failed to receive shipment.', 'error');
    } finally {
      setIsReceivingShipment(false);
    }
  };

  // Header Title Generation
  const headerTitle = retailerProfile?.name 
    ? `${retailerProfile.name.toUpperCase()} DASHBOARD`
    : 'RETAILER DASHBOARD';

  // Demo Status Detection - Show demo status when user has a role but no registered profile
  const isDemoRole = !retailerProfile?.name ? 'demo' : undefined;
  const displayStatus = isDemoRole || (retailerProfile?.name ? retailerStatus : undefined);

  // Status Message Logic
  const statusMessage = isDemoRole
    ? 'You are currently viewing as a demo role. This is a demonstration interface.'
    : retailerStatus === 'suspended'
    ? 'Your retailer account is suspended. Please contact admin for assistance.'
    : retailerStatus === 'terminated'
    ? 'Your retailer account has been terminated. Please contact admin for assistance.'
    : '';

  return (
    <div className={styles.pageContainer}>
      <Header
        userRole='retailer'
        title={headerTitle}
        status={displayStatus as any}
        onDisconnect={onDisconnect}
        signer={signer}
        showToast={showToast}
      />
      
      {/* Status Alert Section */}
      {statusMessage && (
        <div className={`${styles.alert} ${styles[isDemoRole || retailerStatus as string]}`}>
          <AlertCircle />
          {statusMessage}
        </div>
      )}
      
      <main className={styles.mainGrid}>
        
        {/* Left Column - Product Management */}
        <div className={styles.leftColumn}>
          {/* Sell Products Section */}
          <div className={styles.cardTop}>
            <h2 className={styles.cardTitle}>Sell Products</h2>
            <ProductInteractionManager
              viewType="retailer"
              products={sellPanelProducts}
              brandAddress={retailerProfile?.brandAddress || ''}
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
              onReturnProducts={handleReturnProducts}
              onFinalizeSale={handleFinalizeSale}
              disabled={retailerStatus !== 'active'}
              isReturningProducts={isReturningProducts}
              isFinalizingSale={isFinalizingSale}
            />
          </div>
          
          {/* Incoming Shipments Section */}
          <div className={styles.cardBottom}>
            <h2 className={styles.cardTitle}>Incoming Shipments</h2>
            {incomingShipments.length > 0 ? (
              <ShipmentManager 
                products={incomingShipments} 
                viewType='shipment'
                disabled={retailerStatus !== 'active'}
                isReceivingShipment={isReceivingShipment}
                onReceive={handleReceiveShipment}
              />
            ) : (
              <div className={styles.emptyPanel}>
                No incoming shipments at this time. Shipments destined to your store will appear here.
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Statistics */}
        <div className={styles.rightColumn}>
          <StatCard 
            title="Products in Stock" 
            value={sellPanelProducts.filter(p => p.status === 'inRetailer').length} 
            icon={<Archive />} 
          />
          <StatCard 
            title="Total Products Sold" 
            value={totalSold} 
            icon={<CheckCircle />} 
          />
          <StatCard 
            title="Incoming Shipments" 
            value={incomingShipments.length} 
            icon={<Truck />} 
          />
        </div>
      </main>
    </div>
  );
}