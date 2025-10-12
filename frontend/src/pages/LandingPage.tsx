/**
 * @file LandingPage.tsx
 * @description The main public-facing page for the Provenance application.
 * It serves as the entry point for all users, explaining the project's value
 * and providing a primary call-to-action for connecting a wallet to access
 * role-based interfaces (admin, brand, retailer, consumer).
 */

import styles from './LandingPage.module.css';
import LogoIcon from "../assets/icons/FPD-Logo.svg?react";

interface LandingPageProps {
  onConnect?: () => void;
}

export default function LandingPage({ onConnect }: LandingPageProps) {
  return (
    <div className={styles.pageContainer}>
      {/* Header Section */}
      <header className={styles.headerContainer}>
        <div className={styles.logoTitleWrapper}>
          <LogoIcon className={styles.logo} />
          <h1 className={styles.headerTitle}>Provenance</h1>
        </div>
        <button className={styles.connectWalletBtn} onClick={onConnect}>
          CONNECT WALLET
        </button>
      </header>

      {/* Main Content Section */}
      <main className={styles.mainLayout}>
        {/* Hero Section */}
        <div className={styles.topRow}>
          <div className={styles.bigTitleContainer}>
            <h1 className={styles.bigTitle}>
              Immutable<br />Proof for Every<br />Product
            </h1>
          </div>
          
          {/* Brand Protection Section */}
          <div className={styles.featureCard}>
            <div className={styles.featureCardContent}>
              <div className={styles.pillsContainer}>
                <div className={styles.featurePill}>Eliminate counterfeits with on-chain proof</div>
                <div className={styles.featurePill}>Secure your revenue and reputation</div>
                <div className={styles.featurePill}>Build direct trust with your customers</div>
              </div>
              <h2 className={styles.featureTitle}>
                Protect<br />Your Brand
              </h2>
            </div>
          </div>
        </div>

        {/* Consumer Benefits Section */}
        <div className={styles.BottomRow}>
          <div className={styles.featureCard}>
            <div className={styles.featureCardContent}>
              <h2 className={styles.featureTitle}>
                Shop With<br />Confidence
              </h2>
              <div className={styles.pillsContainer}>
                <div className={styles.featurePill}>Instantly verify any product's authenticity</div>
                <div className={styles.featurePill}>View a product's complete, transparent history</div>
                <div className={styles.featurePill}>Guarantee you're getting the real deal</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}