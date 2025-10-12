/**
 * @file ShipmentManager.tsx
 * @description Shipment management component for handling incoming shipments and returns.
 * Provides product selection, bulk selection capabilities, and action buttons for receiving
 * shipments. Used in both brand and retailer interfaces for managing product transfers.
 */

import { useState } from 'react';
import ProductManager from './ProductManager';
import styles from './ShipmentManager.module.css';

import X from '../../assets/icons/x.svg?react';

import type { ShipmentManagerProps } from '../../types/types';

export default function ShipmentManager({ 
  products, 
  viewType, 
  disabled = false, 
  isConfirmingReturn = false,
  isReceivingShipment = false,
  onReceive 
}: ShipmentManagerProps) {
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);

  // Product Selection Logic Section
  const getSelectableIds = () => {
    return products.filter(p => p.status === 'inTransit').map(p => p.id);
  };

  const allSelectableIds = getSelectableIds();
  const areAllSelected = allSelectableIds.length > 0 && selectedProductIds.length === allSelectableIds.length;

  // Selection Handlers Section
  const handleSelectAll = () => {
    if (areAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(allSelectableIds); 
    }
  };

  const removeProduct = (idToRemove: number) => {
    setSelectedProductIds(ids => ids.filter(id => id !== idToRemove));
  };
  
  const actionButtonText = viewType === 'returns' ? 'Receive Returns' : 'Receive Shipment';

  // Check if there are any products to display
  const hasProducts = products.length > 0;

  return (
    <div className={styles.container}>
      {hasProducts ? (
        <>
          {/* Product Table Section */}
          <div className={styles.tableSection}>
            <ProductManager 
              products={products}
              selectedProductIds={selectedProductIds}
              onSelectionChange={setSelectedProductIds}
              viewType={'shipment'} 
            />
          </div>

          {/* Action Panel Section */}
          <div className={styles.actionPanel}>
            <label>SELECTED PRODUCTS</label>
            <div className={styles.selectedProductsList}>
              {selectedProductIds.map(id => (
                <div key={id} className={styles.productTag}>
                  <button onClick={() => removeProduct(id)}><X /></button>
                  <span>#{id}</span>
                </div>
              ))}
            </div>
            
            {/* Action Buttons Section */}
            <div className={styles.buttonGroup}>
              <button onClick={handleSelectAll} className={styles.selectAllButton}>
                {areAllSelected ? 'Unselect All' : 'Select All'}
              </button>
              <button 
                className={styles.receiveButton} 
                disabled={disabled || selectedProductIds.length === 0 || isConfirmingReturn || isReceivingShipment}
                onClick={async () => {
                  if (onReceive) {
                    await onReceive(selectedProductIds);
                    setSelectedProductIds([]);
                  }
                }}
              >
                {isConfirmingReturn ? 'Processing...' : isReceivingShipment ? 'Receiving...' : actionButtonText}
              </button>
            </div>
          </div>
        </>
      ) : (
        /* No Products Message */
        <div className={styles.noProductsMessage}>
          <div className={styles.noProductsIcon}>📦</div>
          <h3>No Incoming Returns</h3>
          <p>There are currently no products being returned to your brand.</p>
        </div>
      )}
    </div>
  );
}