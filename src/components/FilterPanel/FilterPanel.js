import React from 'react';
import { useQuery } from '../../context/QueryContext';
import { useTables } from '../../hooks/useTables';
import styles from './FilterPanel.module.css';

const OPERATORS = ['=', '!=', '<', '>', '<=', '>=', 'LIKE', 'IN'];

export default function FilterPanel() {
  const { queryConfig, updateConfig } = useQuery();
  const { filters } = queryConfig;

  const addFilter = () =>
    updateConfig({ filters: [...filters, { column: '', operator: '=', value: '' }] });

  const updateFilter = (i, field, val) =>
    updateConfig({ filters: filters.map((f, idx) => idx === i ? { ...f, [field]: val } : f) });

  const removeFilter = (i) =>
    updateConfig({ filters: filters.filter((_, idx) => idx !== i) });

  const { catalogs } = useTables();
  const { cdsViews = [] } = queryConfig;

  const getAvailableColumns = () => {
    const cols = [];
    const { leftTable, rightTable } = queryConfig;
    
    const findCols = (tableName) => {
      for (const schemas of Object.values(catalogs)) {
        for (const tbls of Object.values(schemas)) {
          const match = tbls.find(t => t.name === tableName);
          if (match) return match.columns || [];
        }
      }
      return [];
    };

    if (leftTable) findCols(leftTable).forEach(c => cols.push({ name: c.name, table: leftTable }));
    if (rightTable) findCols(rightTable).forEach(c => cols.push({ name: c.name, table: rightTable }));
    
    // Add virtual/CDS columns
    cdsViews.forEach(v => {
      if (v.name) cols.push({ name: v.name, table: 'virtual' });
    });
    
    return cols;
  };

  const availableColumns = getAvailableColumns();

  return (
    <div className={styles.wrap}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <span className={styles.titleIcon}>⊘</span>
          WHERE Filters
        </div>
        <button className={styles.addBtn} onClick={addFilter}>+ Add Filter</button>
      </div>

      {filters.length === 0 && (
        <div className={styles.empty}>No filters — results will not be filtered</div>
      )}

      {filters.map((f, i) => (
        <div key={i} className={styles.filterRow}>
          {i > 0 && <span className={styles.andLabel}>AND</span>}
          <div className={styles.filterInputs}>
            <select
              className={styles.opSelect}
              value={f.column}
              onChange={e => updateFilter(i, 'column', e.target.value)}
            >
              <option value="">-- select column --</option>
              {availableColumns.map(c => (
                <option key={`${c.table}.${c.name}`} value={c.name}>
                  {c.table !== 'virtual' ? `${c.table}.${c.name}` : `[V] ${c.name}`}
                </option>
              ))}
            </select>
            <select
              className={styles.opSelect}
              value={f.operator}
              onChange={e => updateFilter(i, 'operator', e.target.value)}
            >
              {OPERATORS.map(op => <option key={op} value={op}>{op}</option>)}
            </select>
            <input
              className={styles.input}
              placeholder="value"
              value={f.value}
              onChange={e => updateFilter(i, 'value', e.target.value)}
            />
            <button className={styles.removeBtn} onClick={() => removeFilter(i)}>✕</button>
          </div>
        </div>
      ))}

      {/* Order By */}
      <div className={styles.orderSection}>
        <div className={styles.sectionTitle} style={{ marginBottom: 8 }}>
          <span className={styles.titleIcon}>⇅</span>
          ORDER BY
        </div>
        <div className={styles.orderRow}>
          <select
            className={styles.opSelect}
            value={queryConfig.orderBy}
            onChange={e => updateConfig({ orderBy: e.target.value })}
          >
            <option value="">-- select --</option>
            {availableColumns.map(c => (
              <option key={`${c.table}.${c.name}`} value={c.name}>
                {c.table !== 'virtual' ? `${c.table}.${c.name}` : `[V] ${c.name}`}
              </option>
            ))}
          </select>
          <select
            className={styles.opSelect}
            value={queryConfig.orderDir}
            onChange={e => updateConfig({ orderDir: e.target.value })}
          >
            <option value="ASC">ASC</option>
            <option value="DESC">DESC</option>
          </select>
        </div>
      </div>

      {/* Limit */}
      <div className={styles.limitSection}>
        <label className={styles.limitLabel}>Row limit</label>
        <input
          className={`${styles.input} ${styles.limitInput}`}
          type="number"
          value={queryConfig.limit}
          min={1}
          max={100000}
          onChange={e => updateConfig({ limit: Number(e.target.value) })}
        />
      </div>
    </div>
  );
}
