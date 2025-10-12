/**
 * @file DeviceInterface.tsx
 * @description Consumer device interface for product verification. Provides a form-based
 * interface for entering product IDs, generating challenges, and managing the verification
 * workflow. Displays results with product details and handles the complete verification
 * process from initial input to final blockchain verification.
 */

import React, { useState } from 'react';
import styles from './DeviceInterface.module.css';

import CheckCircle from '../../assets/icons/check-circle.svg?react';
import XCircle from '../../assets/icons/x-circle.svg?react';
import AlertTriangle from '../../assets/icons/alert-triangle.svg?react';
import RefreshCw from '../../assets/icons/refresh-cw.svg?react';

import type { VerificationStatus, ProductData, DeviceInterfaceProps } from '../../types/types';

// Result View Component
const ResultView = ({ 
  status, 
  onReset, 
  productData 
}: { 
  status: VerificationStatus; 
  onReset: () => void;
  productData?: ProductData | null;
}) => {
  const [showProductDetails, setShowProductDetails] = useState(false);
  
  const results = {
    success: { 
      icon: <CheckCircle className={styles.successIcon} />, 
      title: 'Verification Successful', 
      message: 'This product has been verified as authentic on the blockchain.', 
      detailsButton: true,
      showProductInfo: true
    },
    failed: { 
      icon: <XCircle className={styles.failedIcon} />, 
      title: 'Verification Failed', 
      message: 'The signature does not match the product ID. This product may be counterfeit.', 
      detailsButton: false,
      showProductInfo: false
    },
    notFound: { 
      icon: <AlertTriangle className={styles.notFoundIcon} />, 
      title: 'Product Not Found', 
      message: 'This Product ID does not exist on the blockchain. Please check the ID and try again.', 
      detailsButton: false,
      showProductInfo: false
    }
  };
  
  const currentResult = results[status as keyof typeof results];
  if (!currentResult) return null;
  
  return (
    <div className={styles.resultContainer}>
      {currentResult.icon}
      <h3 className={styles.resultTitle}>{currentResult.title}</h3>
      <p className={styles.resultMessage}>{currentResult.message}</p>
      
      {/* Product Details Section */}
      {currentResult.showProductInfo && productData && showProductDetails && (
        <div className={styles.productDetails}>
          <h4>Product Information</h4>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Name:</span>
            <span className={styles.detailValue}>{productData.name}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Brand Address:</span>
            <span className={styles.detailValue}>{productData.brandAddress}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Mint Date:</span>
            <span className={styles.detailValue}>
              {new Date(Number(productData.mintTimestamp) * 1000).toLocaleDateString()}
            </span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Authenticator:</span>
            <span className={styles.detailValue}>{productData.productAuthenticator}</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons Section */}
      <div className={styles.resultActions}>
        {currentResult.detailsButton && productData && (
          <button 
            className={styles.detailsButton}
            onClick={() => setShowProductDetails(!showProductDetails)}
          >
            {showProductDetails ? 'Hide Product Details' : 'Show Product Details'}
          </button>
        )}
        <button onClick={onReset} className={styles.resetButton}>
          <RefreshCw />
          Verify Another Product
        </button>
      </div>
    </div>
  );
};

export default function DeviceInterface({
  status, 
  productId, 
  setProductId, 
  challenge, 
  signature, 
  isSimulating, 
  productData,
  onGenerateChallenge, 
  onConfirmChallenge, 
  onRequestSignature, 
  onVerifyOnChain, 
  onReset,
}: DeviceInterfaceProps) {
  
  const isInitialState = ['idle', 'pending', 'challenge-generated', 'challenge-confirmed', 'signature-generated'].includes(status);

  return (
    <div className={styles.card}>
      <h2 className={styles.cardTitle}>Consumer Device Interface</h2>
      
      {isInitialState ? (
        <>
          {/* Input Fields Section */}
          <div className={styles.formGroup}>
            <label>PRODUCT ID</label>
            <input 
              type="text" 
              value={productId} 
              onChange={(e) => setProductId(e.target.value)} 
              disabled={isSimulating || status !== 'idle'}
              placeholder="Enter Product ID"
            />
          </div>
          <div className={styles.formGroup}>
            <label>CHALLENGE (NONCE)</label>
            <input 
              type="text" 
              value={challenge} 
              readOnly 
              disabled
              className={styles.autoGeneratedInput} 
              placeholder="Challenge will appear here"
            />
          </div>
          <div className={styles.formGroup}>
            <label>SIGNATURE (RESPONSE)</label>
            <input 
              type="text" 
              value={signature} 
              readOnly 
              disabled
              className={styles.autoGeneratedInput} 
              placeholder="Signature will appear here"
            />
          </div>
          
          {/* Action Buttons Section */}
          <div className={styles.buttonRow}>
            <button 
              onClick={onGenerateChallenge} 
              disabled={isSimulating || !productId || (status !== 'idle' && status !== 'challenge-generated')}
              className={`${styles.primaryButton} ${challenge ? styles.regenerateButton : ''}`}
            >
              {challenge ? 'Regenerate Challenge' : 'Generate Challenge'}
            </button>
            <button 
              onClick={onConfirmChallenge}
              disabled={isSimulating || status !== 'challenge-generated'} 
              className={styles.primaryButton}
            >
              Confirm Challenge
            </button>
          </div>
          <button onClick={onRequestSignature} disabled={isSimulating || status !== 'challenge-confirmed'} className={styles.primaryButton}>
            Request Signature from PUF
          </button>
          <button onClick={onVerifyOnChain} disabled={isSimulating || status !== 'signature-generated'} className={styles.primaryButton}>
            Verify On-Chain
          </button>
        </>
      ) : (
        <ResultView status={status} onReset={onReset} productData={productData} />
      )}
    </div>
  );
}