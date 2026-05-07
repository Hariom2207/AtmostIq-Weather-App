import React, { useState, useRef } from 'react';
import styles from './ChartPanel.module.css';

export default function ChartPanel({ title, children, height = 220 }) {
  const scrollRef = useRef(null);
  const [zoom, setZoom] = useState(1);

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.3, 4));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.3, 1));
  const handleReset = () => setZoom(1);

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.title}>{title}</span>
        <div className={styles.controls}>
          <button className={styles.btn} onClick={handleZoomOut} title="Zoom out">−</button>
          <button className={styles.btn} onClick={handleReset} title="Reset">⟳</button>
          <button className={styles.btn} onClick={handleZoomIn} title="Zoom in">+</button>
        </div>
      </div>
      <div className={styles.scrollArea} ref={scrollRef}>
        <div style={{ width: `${zoom * 100}%`, minWidth: '100%', height }}>
          {children}
        </div>
      </div>
    </div>
  );
}
