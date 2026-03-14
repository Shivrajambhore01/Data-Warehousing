import React, { useEffect, useState } from 'react';
import { fetchHistory, deleteHistory } from '../services/apiService';
import { formatTime } from '../utils/sqlGenerator';
import { useNavigate } from 'react-router-dom';
import styles from './QueryHistoryPage.module.css';

export default function QueryHistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    fetchHistory(1, 50)
      .then(d => setHistory(d.history))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteHistory(id);
    setHistory(prev => prev.filter(h => h.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const openInLab = (sql) => navigate('/sql-lab', { state: { sql } });

  return (
    <div className={styles.page}>
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>◷ Query History</span>
          <span className={styles.count}>{history.length} queries</span>
        </div>

        {loading ? (
          <div className={styles.loadingState}><span className={styles.spinner} /> Loading...</div>
        ) : history.length === 0 ? (
          <div className={styles.emptyState}>No query history yet</div>
        ) : (
          <div className={styles.historyList}>
            {history.map(h => (
              <button
                key={h.id}
                className={`${styles.histItem} ${selected?.id === h.id ? styles.activeItem : ''}`}
                onClick={() => setSelected(h)}
              >
                <div className={styles.histTop}>
                  <span className={`${styles.status} ${styles[h.status]}`}>
                    {h.status === 'success' ? '✓' : '✕'}
                  </span>
                  <span className={styles.histTime}>{new Date(h.executedAt).toLocaleTimeString()}</span>
                  <button className={styles.deleteBtn} onClick={(e) => handleDelete(h.id, e)}>✕</button>
                </div>
                <div className={styles.histSQL}>{h.sql.replace(/\s+/g, ' ').slice(0, 90)}...</div>
                <div className={styles.histMeta}>
                  <span>{h.rowCount} rows</span>
                  <span>{formatTime(h.executionTime)}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={styles.rightPanel}>
        {!selected ? (
          <div className={styles.emptyRight}>
            <span className={styles.emptyIcon}>◷</span>
            <div>Select a query to view details</div>
          </div>
        ) : (
          <div className={styles.detailView}>
            <div className={styles.detailHeader}>
              <div className={styles.detailMeta}>
                <span className={`${styles.status} ${styles[selected.status]}`}>
                  {selected.status === 'success' ? '✓ Success' : '✕ Error'}
                </span>
                <span className={styles.detailTime}>
                  {new Date(selected.executedAt).toLocaleString()}
                </span>
                <span className={styles.detailRows}>{selected.rowCount} rows</span>
                <span className={styles.detailDuration}>{formatTime(selected.executionTime)}</span>
              </div>
              <div className={styles.detailActions}>
                <button className={styles.openBtn} onClick={() => openInLab(selected.sql)}>
                  ⟨⟩ Open in SQL Lab
                </button>
              </div>
            </div>
            <pre className={styles.sqlBlock}>{selected.sql}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
