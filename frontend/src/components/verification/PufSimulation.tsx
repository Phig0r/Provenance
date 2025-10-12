/**
 * @file PufSimulation.tsx
 * @description Simulates a Physical Unclonable Function (PUF) chip for product authentication.
 * Displays private and public keys extracted from verification logs, and shows real-time
 * PUF operation logs including key retrieval, signature generation, and blockchain interaction.
 */

import { useState, useEffect } from 'react';
import styles from './PufSimulation.module.css';

import type { PufSimulationProps } from '../../types/types';

export default function PufSimulation({ log }: PufSimulationProps) {
  const [privateKey, setPrivateKey] = useState('');
  const [publicKey, setPublicKey] = useState('');

  // Key Extraction Section
  useEffect(() => {
    if (log.length === 1 && log[0] === 'STATUS: PUF is online and awaiting request...') {
      setPublicKey('');
      setPrivateKey('');
      return;
    }
    
    for (const logEntry of log) {
      const publicKeyMatch = logEntry.match(/PUF Public Key: (0x[a-fA-F0-9]+)/);
      if (publicKeyMatch) {
        setPublicKey(publicKeyMatch[1]);
      }
      
      const privateKeyMatch = logEntry.match(/PUF Private Key: (0x[a-fA-F0-9]+)/);
      if (privateKeyMatch) {
        setPrivateKey(privateKeyMatch[1]);
      }
    }
  }, [log]);

  return (
    <div className={`${styles.card} ${styles.darkCard}`}>
      <h2 className={styles.cardTitle}>PUF Chip Simulation</h2>
      
      {/* Key Display Section */}
      <div className={styles.formGroup}>
        <label>Product's PRIVATE KEY <span className={styles.demoText}>(retrieved from PUF storage)</span></label>
        <input 
          type="text" 
          value={privateKey} 
          readOnly 
          disabled 
          placeholder="Private key will appear here"
          className={!privateKey ? styles.placeholderInput : ''}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Product's PUBLIC KEY <span className={styles.demoText}>(from blockchain)</span></label>
        <input 
          type="text" 
          value={publicKey} 
          readOnly 
          disabled 
          placeholder="Public key will appear here"
          className={!publicKey ? styles.placeholderInput : ''}
        />
      </div>
      
      {/* Log Display Section */}
      <div className={styles.logContainer}>
        <label>Log</label>
        <pre className={styles.logContent}>{log.join('\n')}</pre>
      </div>
    </div>
  );
}