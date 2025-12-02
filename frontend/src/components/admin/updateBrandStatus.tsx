/**
 * @file updateBrandStatus.tsx
 * @description Modal component for updating brand status in the admin interface.
 * Allows admins to change brand status between pending, active, suspended, and revoked
 * with appropriate validation and visual feedback for current status.
 */

import { useState, useEffect } from 'react';
import styles from './updateBrandStatus.module.css';

import X from '../../assets/icons/x.svg?react';

import type { UpdateBrandStatusProps } from '../../types/types';

export default function UpdateBrandStatus({
  brandName,
  currentStatus,
  onClose,
  onUpdate,
}: UpdateBrandStatusProps) {
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
        
        <h2 className={styles.title}>Update Brand Status</h2>
        
        <p className={styles.subtitle}>
          Select the operational status for <strong>{brandName}</strong>
        </p>

        {/* Status Selection Section */}
        <div className={styles.statusGrid}>
          {['pending', 'active', 'suspended', 'revoked'].map((status) => (
            <div key={status} className={styles.radioContainer}>
              <label htmlFor={`status-${status}`} className={`${styles.radioLabel} ${styles[status]}`}>
                <input
                  type="radio"
                  id={`status-${status}`}
                  name="brandStatus"
                  value={status}
                  checked={selectedStatus === status}
                  onChange={() => setSelectedStatus(status as typeof currentStatus)}
                  className={styles.radioInput}
                  disabled={status === 'pending' || currentStatus === status} 
                />
                <span className={styles.customRadio}></span>
                {status.charAt(0).toUpperCase() + status.slice(1)}
                
                {status === 'pending' && currentStatus === 'pending' && <span className={styles.currentTag}>(current)</span>}
                {status === 'pending' && currentStatus !== 'pending' && <span className={styles.infoTag}>(Cannot revert)</span>}
                {status !== 'pending' && currentStatus === status && <span className={styles.currentTag}>(current)</span>}
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
  );
}