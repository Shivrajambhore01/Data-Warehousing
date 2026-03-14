import React, { useEffect, useState } from 'react';
import { fetchSaved, deleteSaved } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import styles from './SavedQueriesPage.module.css';

export default function SavedQueriesPage() {
  const [queries, setQueries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    fetchSaved()
      .then(d => setQueries(d.queries))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    await deleteSaved(id);
    setQueries(prev => prev.filter(q => q.id !== id));
    if (selected?.id === id) setSelected(null);
  };

  const filtered = queries.filter(q =>
    !search || q.name.toLowerCase().includes(search.toLowerCase()) ||
    q.description?.toLowerCase().includes(search.toLowerCase()) ||
    q.tags?.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className={styles.page}>
      {/* Left panel */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>◉ Saved Queries</span>
          <span className={styles.count}>{queries.length}</span>
        </div>

        <div className={styles.searchWrap}>
          <input
            className={styles.searchInput}
            placeholder="Search saved queries..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className={styles.loadingState}><span className={styles.spinner} /> Loading...</div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            {search ? 'No results found' : 'No saved queries yet'}
          </div>
        ) : (
          <div className={styles.queryList}>
            {filtered.map(q => (
              <button
                key={q.id}
                className={`${styles.queryItem} ${selected?.id === q.id ? styles.activeItem : ''}`}
                onClick={() => setSelected(q)}
              >
                <div className={styles.queryTop}>
                  <span className={styles.queryName}>{q.name}</span>
                  <button className={styles.deleteBtn} onClick={e => handleDelete(q.id, e)}>✕</button>
                </div>
                {q.description && (
                  <div className={styles.queryDesc}>{q.description}</div>
                )}
                <div className={styles.queryMeta}>
                  {q.tags?.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                  <span className={styles.date}>{new Date(q.createdAt).toLocaleDateString()}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right panel */}
      <div className={styles.rightPanel}>
        {!selected ? (
          <div className={styles.emptyRight}>
            <span className={styles.emptyIcon}>◉</span>
            <div className={styles.emptyTitle}>Select a saved query</div>
            <div className={styles.emptyDesc}>Choose a query from the list to view its SQL and open it in the lab.</div>
          </div>
        ) : (
          <div className={styles.detailView}>
            <div className={styles.detailHeader}>
              <div>
                <h2 className={styles.detailName}>{selected.name}</h2>
                {selected.description && (
                  <p className={styles.detailDesc}>{selected.description}</p>
                )}
                <div className={styles.detailTags}>
                  {selected.tags?.map(tag => (
                    <span key={tag} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              </div>
              <div className={styles.detailActions}>
                <button
                  className={styles.openBtn}
                  onClick={() => navigate('/sql-lab', { state: { sql: selected.sql } })}
                >
                  ⟨⟩ Open in SQL Lab
                </button>
                <button
                  className={styles.copyBtn}
                  onClick={() => navigator.clipboard.writeText(selected.sql)}
                >
                  ⎘ Copy SQL
                </button>
              </div>
            </div>

            <div className={styles.sqlSection}>
              <div className={styles.sqlLabel}>SQL Query</div>
              <pre className={styles.sqlBlock}>{selected.sql}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
