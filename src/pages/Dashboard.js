import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkHealth, fetchHistory } from '../services/apiService';
import { formatTime } from '../utils/sqlGenerator';
import styles from './Dashboard.module.css';

const TEMPLATES = [
  {
    title: 'Monthly Revenue by Region',
    desc: 'Aggregate sales revenue grouped by region and month',
    icon: '◈',
    sql: `SELECT t2.customer_region,\n  DATE_TRUNC('month', t1.transaction_date) AS month,\n  SUM(t1.amount_usd) AS total_revenue\nFROM fact_sales t1\nINNER JOIN dim_customers t2 ON t1.customer_id = t2.customer_id\nGROUP BY 1, 2\nORDER BY 2 DESC`,
    tag: 'Revenue',
  },
  {
    title: 'Top Customers by LTV',
    desc: 'Rank customers by lifetime value descending',
    icon: '◉',
    sql: `SELECT customer_name, customer_region, lifetime_value\nFROM dim_customers\nORDER BY lifetime_value DESC\nLIMIT 100`,
    tag: 'Customers',
  },
  {
    title: 'Product Performance',
    desc: 'Units sold and revenue per product category',
    icon: '⬡',
    sql: `SELECT p.category, p.product_name,\n  SUM(s.quantity) AS units_sold,\n  SUM(s.amount_usd) AS revenue\nFROM fact_sales s\nINNER JOIN dim_products p ON s.product_id = p.product_id\nGROUP BY 1, 2\nORDER BY 4 DESC`,
    tag: 'Products',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [health, setHealth] = useState(null);
  const [recentQueries, setRecentQueries] = useState([]);

  useEffect(() => {
    checkHealth().then(setHealth).catch(() => setHealth({ status: 'error' }));
    fetchHistory(1, 5).then(d => setRecentQueries(d.history)).catch(() => {});
  }, []);

  return (
    <div className={styles.page}>
      {/* Hero */}
      <div className={styles.hero}>
        <div className={styles.heroLeft}>
          <h1 className={styles.heroTitle}>
            Data<span className={styles.heroAccent}>Forge</span>
          </h1>
          <p className={styles.heroSub}>
            Modern data warehouse query platform for engineers and analysts
          </p>
          <div className={styles.heroCtas}>
            <button className={styles.primaryBtn} onClick={() => navigate('/query-builder')}>
              ◈ Open Query Builder
            </button>
            <button className={styles.secondaryBtn} onClick={() => navigate('/sql-lab')}>
              ⟨⟩ SQL Lab
            </button>
          </div>
        </div>
        <div className={styles.heroRight}>
          <div className={styles.statusCard}>
            <div className={styles.statusRow}>
              <span className={`${styles.statusDot} ${health?.status === 'demo_mode' || health?.status === 'ok' ? styles.online : styles.offline}`} />
              <span className={styles.statusText}>
                {health?.status === 'demo_mode' || health?.status === 'ok' ? 'Connected (Demo Mode)' : 'Backend Offline'}
              </span>
            </div>
            <div className={styles.statusDetail}>PostgreSQL · main_catalog</div>
            <div className={styles.statusDetail}>Version 1.0.0</div>
          </div>
        </div>
      </div>

      {/* Quick stats */}
      <div className={styles.statsGrid}>
        {[
          { label: 'Catalogs',      val: '2',   icon: '◈', color: 'var(--accent)' },
          { label: 'Schemas',       val: '3',   icon: '▤', color: 'var(--cyan)' },
          { label: 'Tables',        val: '7',   icon: '▦', color: 'var(--success)' },
          { label: 'Queries Run',   val: recentQueries.length || '0', icon: '▶', color: 'var(--accent)' },
        ].map(stat => (
          <div key={stat.label} className={styles.statCard}>
            <span className={styles.statIcon} style={{ color: stat.color }}>{stat.icon}</span>
            <span className={styles.statVal}>{stat.val}</span>
            <span className={styles.statLabel}>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.grid}>
        {/* Query templates */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Query Templates</span>
            <span className={styles.panelHint}>Click to open in SQL Lab</span>
          </div>
          <div className={styles.templateList}>
            {TEMPLATES.map(t => (
              <button
                key={t.title}
                className={styles.templateCard}
                onClick={() => navigate('/sql-lab', { state: { sql: t.sql } })}
              >
                <div className={styles.templateTop}>
                  <span className={styles.templateIcon}>{t.icon}</span>
                  <span className={styles.templateTag}>{t.tag}</span>
                </div>
                <div className={styles.templateTitle}>{t.title}</div>
                <div className={styles.templateDesc}>{t.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Recent history */}
        <div className={styles.panel}>
          <div className={styles.panelHeader}>
            <span className={styles.panelTitle}>Recent Queries</span>
            <button className={styles.panelLink} onClick={() => navigate('/history')}>
              View all →
            </button>
          </div>
          {recentQueries.length === 0 ? (
            <div className={styles.emptyState}>No queries yet — run your first query</div>
          ) : (
            <div className={styles.historyList}>
              {recentQueries.map(q => (
                <div key={q.id} className={styles.historyItem}>
                  <div className={styles.historySql}>{q.sql.split('\n')[0].slice(0, 80)}…</div>
                  <div className={styles.historyMeta}>
                    <span className={`${styles.histStatus} ${styles[q.status]}`}>{q.status}</span>
                    <span>{q.rowCount} rows</span>
                    <span>{formatTime(q.executionTime)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick nav */}
      <div className={styles.quickNav}>
        {[
          { label: 'Catalog Explorer', path: '/catalog', icon: '▤', desc: 'Browse tables & schemas' },
          { label: 'Query Builder',    path: '/query-builder', icon: '◈', desc: 'Visual SQL construction' },
          { label: 'SQL Lab',          path: '/sql-lab', icon: '⟨⟩', desc: 'Write raw SQL queries' },
          { label: 'Saved Queries',    path: '/saved', icon: '◉', desc: 'Manage your saved work' },
        ].map(item => (
          <button key={item.path} className={styles.quickCard} onClick={() => navigate(item.path)}>
            <span className={styles.quickIcon}>{item.icon}</span>
            <span className={styles.quickLabel}>{item.label}</span>
            <span className={styles.quickDesc}>{item.desc}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
