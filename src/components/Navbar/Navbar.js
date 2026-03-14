import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import styles from './Navbar.module.css';

const PAGE_TITLES = {
  '/dashboard':     'Dashboard',
  '/query-builder': 'Query Builder',
  '/sql-lab':       'SQL Lab',
  '/catalog':       'Catalog Explorer',
  '/history':       'Query History',
  '/saved':         'Saved Queries',
};

export default function Navbar() {
  const location = useLocation();
  const [search, setSearch] = useState('');
  const title = PAGE_TITLES[location.pathname] || 'DataForge';

  return (
    <header className={styles.navbar}>
      <div className={styles.left}>
        <span className={styles.breadcrumb}>
          <span className={styles.breadcrumbRoot}>dataforge</span>
          <span className={styles.breadcrumbSep}>/</span>
          <span className={styles.breadcrumbPage}>{title}</span>
        </span>
      </div>

      <div className={styles.center}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.searchInput}
            type="text"
            placeholder="Search tables, queries, schemas..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className={styles.searchShortcut}>⌘K</span>
        </div>
      </div>

      <div className={styles.right}>
        <button className={styles.iconBtn} title="Notifications">
          <span className={styles.bellIcon}>◌</span>
          <span className={styles.badge}>2</span>
        </button>
        <button className={styles.iconBtn} title="Settings">⚙</button>
        <div className={styles.avatar}>
          <span>DU</span>
        </div>
      </div>
    </header>
  );
}
