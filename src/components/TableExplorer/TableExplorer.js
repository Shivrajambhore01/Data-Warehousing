import React, { useState } from 'react';
import { useTables } from '../../hooks/useTables';
import { formatRows, formatBytes, typeColor } from '../../utils/sqlGenerator';
import styles from './TableExplorer.module.css';

export default function TableExplorer({ onSelectTable }) {
  const { catalogs, loading, error } = useTables();
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div className={styles.state}>
      <span className={styles.spinner} />
      <span>Loading catalog...</span>
    </div>
  );
  if (error) return (
    <div className={styles.state}>
      <span className={styles.errorIcon}>⚠</span>
      <span>Failed to load: {error}</span>
    </div>
  );

  return (
    <div className={styles.explorer}>
      <div className={styles.header}>
        <span className={styles.headerTitle}>Catalog Explorer</span>
        <div className={styles.headerActions}>
          <button className={styles.iconBtn}>bar</button>
        </div>
      </div>
      
      <div className={styles.searchWrap}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          placeholder="Search catalog..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tree}>
        {Object.entries(catalogs).map(([catalogName, schemas]) => {
          const catKey = catalogName;
          const catOpen = expanded[catKey] !== false;
          return (
            <div key={catalogName} className={styles.catalogNode}>
              <button className={styles.treeRow} onClick={() => toggle(catKey)}>
                <span className={`${styles.arrow} ${catOpen ? styles.open : ''}`}>▶</span>
                <span className={styles.catIcon}>☁</span>
                <span className={styles.nodeName}>{catalogName}</span>
              </button>

              {catOpen && Object.entries(schemas).map(([schemaName, tables]) => {
                const schKey = `${catalogName}.${schemaName}`;
                const schOpen = expanded[schKey] !== false;
                const filteredTables = tables.filter(t =>
                  !search || t.name.toLowerCase().includes(search.toLowerCase())
                );
                if (filteredTables.length === 0 && search) return null;
                return (
                  <div key={schemaName} className={styles.schemaNode}>
                    <button className={styles.treeRow} onClick={() => toggle(schKey)}>
                      <span className={`${styles.arrow} ${schOpen ? styles.open : ''}`}>▶</span>
                      <span className={styles.schemaIcon}>▤</span>
                      <span className={styles.nodeName}>{schemaName}</span>
                    </button>

                    {schOpen && (
                      <div className={styles.tableList}>
                        {filteredTables.map(table => (
                          <button
                            key={table.name}
                            className={styles.tableRow}
                            onClick={() => onSelectTable?.({ catalog: catalogName, schema: schemaName, ...table })}
                          >
                            <span className={styles.tableIcon}>▦</span>
                            <span className={styles.tableName}>{table.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
