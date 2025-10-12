/**
 * @file UpdateRetailerStatus.tsx
 * @description Modal component for updating retailer status in the brand interface.
 * Allows brands to change retailer status between active, suspended, and terminated
 * with appropriate validation and visual feedback for current status.
 */

import React, { useState, useEffect } from 'react';
import styles from './UpdateRetailerStatus.module.css';

import X from '../../assets/icons/x.svg?react';

import type { UpdateRetailerStatusProps } from '../../types/types';

export default function UpdateRetailerStatus({
  retailerName,
  currentStatus,
  onClose,
  onUpdate,
}: UpdateRetailerStatusProps) {
  const [selectedStatus, setSelectedStatus] = useState<string>("");

  // Body Scroll Lock Section
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Update Handler
  const handleUpdateClick = () => {
    onUpdate(selectedStatus);
    onClose();
  };
  
  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header Section */}
        <button onClick={onClose} className={styles.closeButton}>
          <X />
        </button>
        
        <h2 className={styles.title}>Update Retailer Status</h2>
        
        <p className={styles.subtitle}>
          Select the operational status for <strong>{retailerName}</strong>
        </p>

        {/* Content Section */}
        <div className={styles.contentWrapper}>
          {/* Status Selection Section */}
          <div className={styles.statusList}>
            {['active', 'suspended', 'terminated'].map((status) => (
              <div key={status} className={styles.radioContainer}>
                <label htmlFor={`status-${status}`} className={`${styles.radioLabel} ${styles[status]}`}>
                  <input
                    type="radio"
                    id={`status-${status}`}
                    name="retailerStatus"
                    value={status}
                    checked={selectedStatus === status}
                    onChange={() => setSelectedStatus(status as typeof currentStatus)}
                    className={styles.radioInput}
                    disabled={currentStatus === status} 
                  />
                  <span className={styles.customRadio}></span>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                  {currentStatus === status && <span className={styles.currentTag}>(current)</span>}
                </label>
              </div>
            ))}
          </div>
          
          {/* Action Button Section */}
          <button onClick={handleUpdateClick} className={styles.confirmButton}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}