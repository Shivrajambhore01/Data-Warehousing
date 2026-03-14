import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar/Sidebar';
import Navbar from '../components/Navbar/Navbar';
import NotificationToast from '../components/shared/NotificationToast';
import { useApp } from '../context/AppContext';
import styles from './MainLayout.module.css';

export default function MainLayout() {
  const { sidebarCollapsed, notifications } = useApp();

  return (
    <div className={`${styles.layout} ${sidebarCollapsed ? styles.collapsed : ''}`}>
      <Sidebar />
      <div className={styles.main}>
        <Navbar />
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>
      <div className={styles.toasts}>
        {notifications.map(n => (
          <NotificationToast key={n.id} type={n.type} message={n.msg} />
        ))}
      </div>
    </div>
  );
}
