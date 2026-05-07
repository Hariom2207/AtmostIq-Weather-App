import React from 'react';
import styles from './StatCard.module.css';

export default function StatCard({ icon, label, value, unit, accent, sub }) {
  return (
    <div className={styles.card} style={{ '--accent': accent || 'var(--accent-cyan)' }}>
      <div className={styles.iconWrap}>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.body}>
        <div className={styles.label}>{label}</div>
        <div className={styles.value}>
          {value ?? '—'}
          {unit && <span className={styles.unit}>{unit}</span>}
        </div>
        {sub && <div className={styles.sub}>{sub}</div>}
      </div>
      <div className={styles.glow} />
    </div>
  );
}
