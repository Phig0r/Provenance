/**
 * @file SwitchRoleModal.tsx
 * @description Modal component for switching user roles in the demo environment. Allows users
 * to select between admin, brand, retailer, and consumer roles with visual role cards and
 * descriptions. Integrates with the demo role faucet system for seamless role transitions.
 */

import { useState, useEffect } from 'react';
import styles from './SwitchRoleModal.module.css';

import Shield from '../../assets/icons/shield.svg?react';
import Award from '../../assets/icons/award.svg?react';
import ShoppingBag from '../../assets/icons/shopping-bag.svg?react';
import User from '../../assets/icons/user.svg?react';
import Info from '../../assets/icons/info.svg?react';
import X from '../../assets/icons/x.svg?react';

import type { UserRole, SwitchRoleModalProps } from '../../types/types';

const roleData = {
  admin: { icon: <Shield />, description: 'For site-wide administration.', theme: styles.adminTheme },
  brand: { icon: <Award />, description: 'For product owners.', theme: styles.brandTheme },
  retailer: { icon: <ShoppingBag />, description: 'For product sellers.', theme: styles.retailerTheme },
  consumer: { icon: <User />, description: 'The default role for public verification.', theme: styles.consumerTheme },
};

export default function SwitchRoleModal({ currentRole, onClose, onConfirm }: SwitchRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [showTooltip, setShowTooltip] = useState(false);

  // Body Scroll Lock Section
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Confirmation Handler
  const handleConfirm = () => {
    if (selectedRole) {
      onConfirm(selectedRole);
      onClose();
    }
  };

  return (
    <div className={styles.modalBackdrop}>
      <div className={styles.modalContent}>
        {/* Header Section */}
        <div className={styles.header}>
          <h2 className={styles.title}>Switch Role</h2>
          <button 
            className={styles.infoButton} 
            onClick={() => setShowTooltip(!showTooltip)}
            onBlur={() => setShowTooltip(false)}
          >
            <Info />
          </button>
          {showTooltip && (
            <div className={styles.tooltip}>
              This feature is for demo purposes to simulate viewing the application from different user perspectives.
            </div>
          )}
        </div>
        
        <p className={styles.subtitle}>
          Currently viewing as <strong>{currentRole.toUpperCase()}</strong>. Select a new role to switch.
        </p>
        
        {/* Role Selection Section */}
        <div className={styles.roleList}>
          {(Object.keys(roleData) as UserRole[]).map((role) => {
            const { icon, description, theme } = roleData[role];
            const isCurrent = currentRole === role;
            
            return (
              <label 
                key={role} 
                htmlFor={role} 
                className={`
                  ${styles.roleOption} 
                  ${theme} 
                  ${selectedRole === role ? styles.selected : ''}
                  ${isCurrent ? styles.disabled : ''} 
                `}
              >
                <input
                  type="radio"
                  id={role}
                  name="role"
                  value={role}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                  disabled={isCurrent}
                  className={styles.radioInput}
                />
                <span className={styles.customRadio}></span>
                <div className={styles.roleIcon}>{icon}</div>
                <div className={styles.roleInfo}>
                  <span className={styles.roleTitle}>
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                    {isCurrent && <span className={styles.currentTag}>(current)</span>}
                  </span>
                  <span className={styles.roleDescription}>{description}</span>
                </div>
              </label>
            );
          })}
        </div>
        
        {/* Action Buttons Section */}
        <button 
          onClick={handleConfirm} 
          className={styles.confirmButton}
          disabled={!selectedRole || selectedRole === currentRole}
        >
          Confirm
        </button>

        <button onClick={onClose} className={styles.closeButton}>
          <X />
        </button>
      </div>
    </div>
  );
}