/**
 * @file ProductInteractionManager.tsx
 * @description Product interaction management component that combines product selection with
 * action forms. Handles different interaction types for brand and retailer views including
 * shipment initiation, product returns, and sales finalization. Features input validation
 * and product status checking for proper workflow management.
 */

import { useState } from 'react';
import ProductManager from './ProductManager';
import styles from './ProductInteractionManager.module.css';

import X from '../../assets/icons/x.svg?react';

import type { ProductInteractionManagerProps } from '../../types/types';

export default function ProductInteractionManager({ 
  viewType, 
  products, 
  brandAddress,
  selectedProductIds,
  onSelectionChange,
  disabled = false,
  isInitiatingShipment = false,
  isReturningProducts = false,
  isFinalizingSale = false,
  onInitiateShipment,
  onReturnProducts,
  onFinalizeSale,
}: ProductInteractionManagerProps) {
  const [retailerAddressInput, setRetailerAddressInput] = useState('');

  // Product Removal Handler
  const removeProduct = (idToRemove: number) => {
    onSelectionChange(selectedProductIds.filter(id => id !== idToRemove));
  };

  // Reset Shipment Form Handler
  const resetShipmentForm = () => {
    setRetailerAddressInput('');
  };

  return (
    <div className={styles.container}>
      {/* Product Table Section */}
      <div className={styles.tableSection}>
        <ProductManager 
          products={products}
          viewType={viewType}
          selectedProductIds={selectedProductIds}
          onSelectionChange={onSelectionChange}
        />
      </div>

      {/* Action Forms Section */}
      <div className={styles.actionSection}>
        {viewType === 'retailer' && (
          <>
            {/* Return Products Form */}
            <div className={`${styles.actionCard} ${styles.disabledFormGroup}`}>
              <div className={styles.formGroup}>
                <label>BRAND ADDRESS</label>
                <input type="text" value={brandAddress || ''} disabled />
              </div>
              <div className={styles.formGroup}>
                <label>SELECTED PRODUCTS</label>
                <div className={styles.selectedProductsList}>
                  {selectedProductIds.map(id => (
                    <div key={id} className={styles.productTag}>
                      <button onClick={() => removeProduct(id)}><X /></button>
                      <span>#{id}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className={styles.actionButton} 
                disabled={disabled || selectedProductIds.length === 0 || isReturningProducts}
                onClick={() => onReturnProducts && onReturnProducts(selectedProductIds)}
              >
                {isReturningProducts ? 'Returning...' : 'Return Products'}
              </button>
            </div>
            
            {/* Sell Product Form */}
            <div className={styles.actionCard}>
              <div className={styles.formGroup}>
                <label>CONSUMER ADDRESS</label>
                <input type="text" id="consumerAddress" />
              </div>
              <div className={styles.formGroup}>
                <label>PRODUCT ID</label>
                <input type="text" id="productId" />
              </div>
              <button 
                className={styles.actionButton} 
                disabled={disabled || isFinalizingSale}
                onClick={() => {
                  const consumer = (document.getElementById('consumerAddress') as HTMLInputElement)?.value || '';
                  const pidStr = (document.getElementById('productId') as HTMLInputElement)?.value || '';
                  const pid = Number(pidStr);
                  if (!consumer || !pid) return;
                  onFinalizeSale && onFinalizeSale(pid, consumer);
                }}
              >
                {isFinalizingSale ? 'Selling...' : 'Sell'}
              </button>
            </div>
          </>
        )}

        {viewType === 'brand' && (
          <>
            {/* Initiate Shipment Form */}
            <div className={styles.actionCard}>
              <div className={styles.formGroup}>
                <label>RETAILER ADDRESS</label>
                <input 
                  type="text" 
                  value={retailerAddressInput}
                  onChange={(e) => setRetailerAddressInput(e.target.value)}
                  placeholder="e.g., 0xabc..."
                />
              </div>
              <div className={styles.formGroup}>
                <label>SELECTED PRODUCTS</label>
                <div className={styles.selectedProductsList}>
                  {selectedProductIds.map(id => (
                    <div key={id} className={styles.productTag}>
                      <button onClick={() => removeProduct(id)}><X /></button>
                      <span>#{id}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className={styles.actionButton} 
                disabled={disabled || retailerAddressInput.trim() === '' || selectedProductIds.length === 0 || isInitiatingShipment}
                onClick={() => {
                  if (onInitiateShipment) {
                    const invalidProducts = selectedProductIds.filter(id => {
                      const product = products.find(p => p.id === id);
                      return !product || product.status !== 'inFactory';
                    });
                    
                    if (invalidProducts.length > 0) {
                      console.warn('Some selected products are not in InFactory status:', invalidProducts);
                    }
                    
                    onInitiateShipment(retailerAddressInput.trim(), selectedProductIds, resetShipmentForm);
                  }
                }}
              >
                {isInitiatingShipment ? 'Initiating...' : 'Initiate Shipment'}
              </button>
            </div>
            
            {/* Direct Order Form */}
            <div className={styles.actionCard}>
              <div className={styles.formGroup}>
                <label>CONSUMER ADDRESS</label>
                <input type="text" />
              </div>
              <div className={styles.formGroup}>
                <label>PRODUCT ID</label>
                <input type="text" />
              </div>
              <button className={styles.actionButton} disabled={disabled}>
                Fulfill Direct Order
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}