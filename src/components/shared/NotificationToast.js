import React from 'react';
import styles from './NotificationToast.module.css';

const ICONS = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };

export default function NotificationToast({ type = 'info', message }) {
  return (
    <div className={`${styles.toast} ${styles[type]}`}>
      <span className={styles.icon}>{ICONS[type]}</span>
      <span className={styles.msg}>{message}</span>
    </div>
  );
}
