/**
 * @file Toast.tsx
 * @description Global toast notification component for displaying transient messages to users.
 * Supports three types: info (with loading spinner), success, and error. Features auto-dismiss
 * functionality for success and error messages, with manual close option for all types.
 */

import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

import type { ToastProps, ToastType } from '../../types/types';

const AUTO_DISMISS_DELAY = {
  success: 3000,
  error: 4000,
  info: 0,
};

// Toast Icon Component
function ToastIcon({ type }: { type: ToastType }) {
  switch (type) {
    case 'success':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'error':
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case 'info':
      return <div className={styles.spinner}></div>;
    default:
      return null;
  }
}

export default function Toast({ show, message, type, detail, onClose }: ToastProps) {
  const [current, setCurrent] = useState<{ message: string; type: ToastType; detail?: string }>({ message, type, detail });

  // State Update Section
  useEffect(() => {
    if (show) {
      setCurrent({ message, type, detail });
    }
  }, [show, message, type, detail]);

  // Auto-Dismiss Section
  useEffect(() => {
    if (show && type !== 'info') {
      const delay = AUTO_DISMISS_DELAY[type];
      if (delay > 0) {
        const timer = setTimeout(() => {
          onClose();
        }, delay);
        return () => clearTimeout(timer);
      }
    }
  }, [show, type, onClose]);

  const classes = `${styles.toastContainer} ${show ? styles.show : ''} ${styles[current.type]}`;

  return (
    <div className={classes} role="status" aria-live="polite">
      <div className={styles.iconContainer}>
        <ToastIcon type={current.type} />
      </div>
      <div className={styles.content}>
        <p className={styles.toastMessage}>{current.message}</p>
        {current.type === 'info' && current.detail ? (
          <p className={styles.toastDetail}>{current.detail}</p>
        ) : null}
      </div>
      <button onClick={onClose} className={styles.closeButton} aria-label="Close notification">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  );
}