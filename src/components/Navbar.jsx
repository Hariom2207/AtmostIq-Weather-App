import React from 'react';
import styles from './Navbar.module.css';

export default function Navbar({ page, setPage, locationName }) {
  return (
    <header className={styles.nav}>
      <div className={styles.brand}>
        <span className={styles.logo}>⬡</span>
        <span className={styles.name}>AtmosIQ</span>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${page === 'current' ? styles.active : ''}`}
          onClick={() => setPage('current')}
        >
          <span>Current</span>
        </button>
        <button
          className={`${styles.tab} ${page === 'historical' ? styles.active : ''}`}
          onClick={() => setPage('historical')}
        >
          <span>Historical</span>
        </button>
      </div>

      <div className={styles.location}>
        <span className={styles.locationIcon}>◎</span>
        <span className={styles.locationName}>{locationName || 'Detecting…'}</span>
      </div>
    </header>
  );
}
