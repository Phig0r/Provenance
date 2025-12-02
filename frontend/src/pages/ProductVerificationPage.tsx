/**
 * @file ProductVerificationPage.tsx
 * @description Consumer-facing product verification interface that simulates a PUF (Physical Unclonable Function)
 * device for authenticating products. Features a 4-step verification process: product ID input, challenge
 * generation, signature request, and on-chain verification. Includes real-time PUF simulation with
 * blockchain integration and MongoDB key storage.
 */

import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import type { Signer } from 'ethers';

import Header from '../components/shared/Header';
import DeviceInterface from '../components/verification/DeviceInterface';
import PufSimulation from '../components/verification/PufSimulation';
import { useConsumerOperations } from '../hooks/useWeb3';
import { BACKEND_URL } from '../utils/constants';
import type { ProductData, ToastType, VerificationStatus } from '../types/types';
import styles from './ProductVerificationPage.module.css';

// Animation Overlay Component
const AnimationOverlay = ({ 
  direction, 
  type 
}: { 
  direction: 'left-to-right' | 'right-to-left' | null; 
  type: 'request' | 'response' | null; 
}) => {
  if (!direction || !type) return null;
  const comets = Array.from({ length: 5 }); 
  return (
    <div className={styles.animationOverlay}>
      {comets.map((_, index) => (
        <div 
          key={index} 
          className={`${styles.comet} ${type === 'request' ? styles.cometRequest : styles.cometResponse} ${direction === 'left-to-right' ? styles.moveRight : styles.moveLeft}`} 
          style={{ animationDelay: `${index * 0.08}s` }} 
        />
      ))}
    </div>
  );
};

// Stepper Component
const Stepper = ({ currentStep }: { currentStep: number }) => {
  const steps = [
    { number: 1, label: 'Insert Product ID' },
    { number: 2, label: 'Generate Challenge' },
    { number: 3, label: 'Request Signature' },
    { number: 4, label: 'Verify On-Chain' }
  ];
  
  return (
    <div className={styles.stepperContainer}>
      {steps.map((step, index) => {
        const isActive = currentStep >= step.number;
        return (
          <React.Fragment key={step.number}>
            <div className={`${styles.step} ${isActive ? styles.active : ''}`}>
              <div className={styles.stepCircle}>{step.number}</div>
              <p className={styles.stepLabel}>{step.label}</p>
            </div>
            {index < steps.length - 1 && <div className={styles.stepConnector}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
};

interface ProductVerificationPageProps {
  onDisconnect?: () => void;
  signer: Signer | null;
  showToast: (message: string, type: ToastType, detail?: string) => void;
}

export default function ProductVerificationPage({ 
  onDisconnect, 
  signer, 
  showToast 
}: ProductVerificationPageProps) {
  const { getProductDetails, verifyProduct, checkNonceUsed } = useConsumerOperations(signer);
  
  // State Management Section
  const [currentStep, setCurrentStep] = useState(1);
  const [log, setLog] = useState<string[]>([]);
  const [productId, setProductId] = useState('');
  const [challenge, setChallenge] = useState('');
  const [signature, setSignature] = useState('');
  const [animationState, setAnimationState] = useState<{ 
    direction: 'left-to-right' | 'right-to-left' | null; 
    type: 'request' | 'response' | null; 
  }>({ direction: null, type: null });
  const [isSimulating, setIsSimulating] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('idle');
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [resetKey, setResetKey] = useState(0);

  // Utility Functions Section
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  const addLogEntry = (entry: string) => setLog(prev => [...prev, entry]);

  // Reset State Function
  const resetState = () => {
    setCurrentStep(1);
    setLog(['STATUS: PUF is online and awaiting request...']);
    setProductId('');
    setChallenge('');
    setSignature('');
    setAnimationState({ direction: null, type: null });
    setVerificationStatus('idle');
    setProductData(null);
    setResetKey(prev => prev + 1);
  };

  useEffect(() => { resetState(); }, []);
  
  // Challenge Generation Handler
  const handleGenerateChallenge = () => {
    if (!productId || isSimulating) return;
    if (signature) setSignature('');
    
    const randomChallenge = Math.floor(Math.random() * 1000000000).toString();
    setChallenge(randomChallenge);
    
    setCurrentStep(2);
    setVerificationStatus('challenge-generated');
  };
  
  // Challenge Confirmation Handler
  const handleConfirmChallenge = async () => {
    if (verificationStatus !== 'challenge-generated' || isSimulating) return;
    setIsSimulating(true);
    
    try {
      const challengeNumber = parseInt(challenge, 10);
      
      try {
        await getProductDetails(productId);
      } catch (_) {
        showToast('Product not found. Please enter a valid product ID.', 'error');
        setVerificationStatus('challenge-generated');
        setIsSimulating(false);
        return;
      }
      
      const isNonceUsed = await checkNonceUsed(productId, challengeNumber);
      
      if (isNonceUsed) {
        showToast('Nonce already used. Please generate a new challenge.', 'error');
        setVerificationStatus('challenge-generated');
        setChallenge('');
      } else {
        showToast('Nonce confirmed as new and valid.', 'success');
        setVerificationStatus('challenge-confirmed');
      }
    } catch (error: any) {
      if (error?.message?.includes('user rejected') || 
          error?.message?.includes('User denied') ||
          error?.message?.includes('User rejected') ||
          error?.code === 4001 ||
          error?.code === 'ACTION_REJECTED') {
        showToast('Transaction cancelled by user.', 'error');
        resetState();
        return;
      } else {
        showToast(`Failed to verify nonce: ${error.message}`, 'error');
        setVerificationStatus('challenge-confirmed');
      }
    } finally {
      setIsSimulating(false);
    }
  };

  // Signature Request Handler
  const handleRequestSignature = async () => {
    if (verificationStatus !== 'challenge-confirmed' || isSimulating) return;
    setIsSimulating(true);
    
    try {
      addLogEntry('STATUS: Requesting signature with nonce...');
      setAnimationState({ direction: 'left-to-right', type: 'request' });
      await sleep(1200);
      
      addLogEntry('STATUS: Fetching product data from blockchain...');
      await sleep(800);
      const productDetails = await getProductDetails(productId);
      setProductData(productDetails);
      
      addLogEntry(`STATUS: Product found: ${productDetails.name}`);
      await sleep(600);
      addLogEntry('STATUS: PUF received nonce, signing data...');
      await sleep(500);

      addLogEntry('STATUS: Retrieving private key from PUF storage...');
      await sleep(700);
      const publicKey = productDetails.productAuthenticator;
      
      try {
        const brandsResponse = await fetch(`${BACKEND_URL}/brands`);
        
        if (!brandsResponse.ok) {
          if (brandsResponse.status === 0 || !navigator.onLine) {
            throw new Error('PUF storage server is offline. Please check your connection and try again.');
          } else {
            throw new Error('PUF storage server error. Please try again later.');
          }
        }
        
        const brands = await brandsResponse.json();
        let brandName = 'default';
        if (brands.length > 0) {
          brandName = brands[0];
        }
        
        const response = await fetch(`${BACKEND_URL}/get-key/${encodeURIComponent(brandName)}/${publicKey}`);
        
        if (!response.ok) {
          if (response.status === 0 || !navigator.onLine) {
            throw new Error('PUF storage server is offline. Please check your connection and try again.');
          } else if (response.status === 404) {
            throw new Error('Private key not found for this product authenticator. The product may not have been properly registered.');
          } else {
            throw new Error('PUF storage server error. Please try again later.');
          }
        }
        
        const { privateKey } = await response.json();
        
        if (!privateKey) {
          throw new Error('Private key not found for this product authenticator. The product may not have been properly registered.');
        }
        
        addLogEntry('STATUS: Private key retrieved, generating signature...');
        await sleep(500);

        const wallet = new ethers.Wallet(privateKey);
        const messageHash = ethers.solidityPackedKeccak256(
          ['uint256', 'uint256'],
          [productId, challenge]
        );
        const signature = await wallet.signMessage(ethers.getBytes(messageHash));
        
        addLogEntry(`STATUS: PUF Public Key: ${publicKey}`);
        await sleep(400);
        addLogEntry(`STATUS: PUF Private Key: ${privateKey}`);
        await sleep(400);
        
        addLogEntry('STATUS: PUF sending signature response...');
        setAnimationState({ direction: 'right-to-left', type: 'response' });
        await sleep(1200);

        setSignature(signature);
        setCurrentStep(4);
        setVerificationStatus('signature-generated');
        setAnimationState({ direction: null, type: null });
        
        addLogEntry('STATUS: PUF signature complete. Ready for blockchain verification.');
        
      } catch (serverError: any) {
        addLogEntry(`ERROR: ${serverError.message}`);
        setVerificationStatus('notFound');
        setCurrentStep(4);
        setAnimationState({ direction: null, type: null });
        return;
      }
      
    } catch (error: any) {
      if (error?.message?.includes('user rejected') || 
          error?.message?.includes('User denied') ||
          error?.message?.includes('User rejected') ||
          error?.code === 4001 ||
          error?.code === 'ACTION_REJECTED') {
        addLogEntry('ERROR: User cancelled signature generation.');
        showToast('Signature generation cancelled by user.', 'error');
        resetState();
        return;
      }
      
      addLogEntry(`ERROR: ${error.message}`);
      setVerificationStatus('notFound');
      setCurrentStep(4);
      setAnimationState({ direction: null, type: null });
    } finally {
      setIsSimulating(false);
    }
  };

  // On-Chain Verification Handler
  const handleVerifyOnChain = async () => {
    if (verificationStatus !== 'signature-generated' || isSimulating || !signer) return;
    setIsSimulating(true);
    
    try {
      const challengeNumber = parseInt(challenge, 10);
      
      showToast('Verifying signature on blockchain...', 'info', 'Submitting verification transaction');
      await sleep(1000);
      
      await verifyProduct(productId, challengeNumber, signature);
      
      showToast('Verification successful! Product is authentic.', 'success');
      setVerificationStatus('success');
      
    } catch (error: any) {
      if (error?.code === 'CALL_EXCEPTION') {
        if (error?.data?.includes('ProvenanceInvalidSignature')) {
          showToast('Verification failed. Signature mismatch.', 'error');
          setVerificationStatus('failed');
        } else if (error?.data?.includes('ProvenanceProductNotFound')) {
          showToast('Product not found on blockchain.', 'error');
          setVerificationStatus('notFound');
        } else if (error?.data?.includes('ProvenanceNonceAlreadyUsed')) {
          showToast('Verification failed. Challenge already used.', 'error');
          setVerificationStatus('failed');
        } else {
          showToast('Verification failed. Unknown error.', 'error');
          setVerificationStatus('failed');
        }
      } else if (error?.message?.includes('user rejected') || 
                 error?.message?.includes('User denied') ||
                 error?.message?.includes('User rejected') ||
                 error?.code === 4001 ||
                 error?.code === 'ACTION_REJECTED') {
        showToast('Transaction cancelled by user.', 'error');
        resetState();
        return;
      } else {
        showToast(`Verification failed. ${error.message}`, 'error');
        setVerificationStatus('failed');
      }
    } finally {
      setCurrentStep(4);
      setIsSimulating(false);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header userRole='consumer' title="Product Verification" onDisconnect={onDisconnect} signer={signer} showToast={showToast} />
      <main className={styles.mainContent}>
        <Stepper key={resetKey} currentStep={currentStep} />
        <div className={styles.verificationContainer}>
          <div className={styles.interfaceGrid}>
            <AnimationOverlay direction={animationState.direction} type={animationState.type} />
            
            <DeviceInterface
              status={verificationStatus}
              productId={productId}
              setProductId={setProductId}
              challenge={challenge}
              signature={signature}
              isSimulating={isSimulating}
              productData={productData}
              onGenerateChallenge={handleGenerateChallenge}
              onConfirmChallenge={handleConfirmChallenge}
              onRequestSignature={handleRequestSignature}
              onVerifyOnChain={handleVerifyOnChain}
              onReset={resetState}
            />
            
            <PufSimulation log={log} />
          </div>
        </div>
      </main>
    </div>
  );
}