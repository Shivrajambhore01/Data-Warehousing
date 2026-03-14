import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import styles from './Sidebar.module.css';

const NAV = [
  {
    group: 'WORKSPACE',
    items: [
      { label: 'Dashboard',     path: '/dashboard',     icon: '⬡' },
      { label: 'Query Builder', path: '/query-builder', icon: '◈' },
      { label: 'SQL Lab',       path: '/sql-lab',       icon: '⟨⟩' },
      { label: 'Query History', path: '/history',       icon: '◷' },
      { label: 'Saved Queries', path: '/saved',         icon: '◉' },
    ],
  },
  {
    group: 'DATA EXPLORER',
    items: [
      { label: 'Catalog Explorer', path: '/catalog', icon: '▤' },
    ],
  },
];

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, sidebarWidth, setSidebarWidth } = useApp();
  const location = useLocation();
  const [isResizing, setIsResizing] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const handleMouseMove = (moveEvent) => {
      const delta = moveEvent.clientX - startX;
      const newWidth = Math.max(160, Math.min(480, startWidth + delta));
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'default';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const currentWidth = sidebarCollapsed ? 68 : sidebarWidth;

  return (
    <aside 
      className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''} ${isResizing ? styles.resizing : ''}`}
      style={{ width: currentWidth }}
    >
      {/* Logo */}
      <div className={styles.logo}>
        <span className={styles.logoMark}>⬡</span>
        <span className={styles.logoText}>Data<span className={styles.logoAccent}>Forge</span></span>
      </div>

      {/* Nav groups */}
      <nav className={styles.nav}>
        {NAV.map(group => (
          <div key={group.group} className={styles.group}>
            <span className={styles.groupLabel}>{group.group}</span>
            {group.items.map(item => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `${styles.navItem} ${isActive ? styles.active : ''}`
                }
              >
                <span className={styles.navIcon}>{item.icon}</span>
                <span className={styles.navLabel}>{item.label}</span>
                {location.pathname === item.path && (
                  <span className={styles.activeDot} />
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        className={styles.collapseBtn}
        onClick={() => setSidebarCollapsed(c => !c)}
      >
        <span className={styles.collapseIcon}>
          {sidebarCollapsed ? '›' : '‹'}
        </span>
        <span className={styles.collapseText}>Collapse</span>
      </button>

      {/* Footer */}
      <div className={styles.footer}>
        <div className={styles.footerDot} />
        <span className={styles.footerText}>PostgreSQL · Connected</span>
      </div>

      {/* Resize Handle */}
      <div 
        className={styles.resizer} 
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
