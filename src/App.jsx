import React, { useState } from 'react';
import Navbar from './components/Navbar';
import CurrentWeather from './pages/CurrentWeather';
import Historical from './pages/Historical';
import { useLocation } from './hooks/useLocation';
import styles from './App.module.css';

export default function App() {
  const [page, setPage] = useState('current');
  const { location, locationName, loading: locLoading } = useLocation();

  if (locLoading) {
    return (
      <div className={styles.splash}>
        <div className={styles.splashInner}>
          <div className={styles.splashLogo}>⬡</div>
          <div className={styles.splashTitle}>AtmosIQ</div>
          <div className="loader" style={{ margin: '0 auto' }} />
          <p className={styles.splashText}>Detecting your location…</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.app}>
      <Navbar page={page} setPage={setPage} locationName={locationName} />
      <main className={styles.main}>
        {page === 'current'
          ? <CurrentWeather location={location} />
          : <Historical location={location} />
        }
      </main>
    </div>
  );
}
