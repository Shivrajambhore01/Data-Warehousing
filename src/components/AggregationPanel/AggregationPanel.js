import React from 'react';
import { useQuery } from '../../context/QueryContext';
import { useTables } from '../../hooks/useTables';
import styles from './AggregationPanel.module.css';

const AGG_FUNCS = [
  'SUM', 'AVG', 'COUNT', 'COUNT DISTINCT', 
  'MAX', 'MIN', 
  'STDDEV_POP', 'STDDEV_SAMP', 
  'VAR_POP', 'VAR_SAMP',
  'COALESCE_SUM'
];

export default function AggregationPanel() {
  const { queryConfig, updateConfig } = useQuery();
  const { aggregations, groupBy, leftTable } = queryConfig;

  const addAgg = () =>
    updateConfig({ aggregations: [...aggregations, { func: 'SUM', column: '', alias: '' }] });

  const updateAgg = (i, field, val) =>
    updateConfig({ aggregations: aggregations.map((a, idx) => idx === i ? { ...a, [field]: val } : a) });

  const removeAgg = (i) =>
    updateConfig({ aggregations: aggregations.filter((_, idx) => idx !== i) });

  const addGroupBy = () => updateConfig({ groupBy: [...groupBy, ''] });

  const updateGroupBy = (i, val) =>
    updateConfig({ groupBy: groupBy.map((g, idx) => idx === i ? val : g) });

  const removeGroupBy = (i) =>
    updateConfig({ groupBy: groupBy.filter((_, idx) => idx !== i) });

  const { catalogs } = useTables();
  
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
    
    return cols;
  };

  const availableColumns = getAvailableColumns();

  return (
    <div className={styles.wrap}>
      {/* Aggregations */}
      <div className={styles.metricsArea}>
        {aggregations.map((agg, i) => (
          <div key={i} className={styles.aggRow}>
            <div className={styles.field}>
              <label className={styles.label}>Column</label>
              <select
                className={styles.select}
                value={agg.column}
                onChange={e => updateAgg(i, 'column', e.target.value)}
              >
                <option value="">-- select column --</option>
                {availableColumns.map(c => (
                  <option key={`${c.table}.${c.name}`} value={c.name}>
                    {c.table}.{c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Function</label>
              <select
                className={styles.select}
                value={agg.func}
                onChange={e => updateAgg(i, 'func', e.target.value)}
              >
                {AGG_FUNCS.map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Alias</label>
              <input
                className={styles.input}
                placeholder="total_revenue"
                value={agg.alias}
                onChange={e => updateAgg(i, 'alias', e.target.value)}
              />
            </div>
            <button className={styles.removeBtn} onClick={() => removeAgg(i)}>✕</button>
          </div>
        ))}
      </div>

      {/* Group By */}
      <div className={styles.groupByArea}>
        <label className={styles.label}>Group By (Dimensions)</label>
        <div className={styles.groupByRow}>
          {groupBy.map((col, i) => (
            <div key={i} className={styles.chip}>
              <select
                className={styles.chipSelect}
                value={col}
                onChange={e => updateGroupBy(i, e.target.value)}
              >
                <option value="">-- select --</option>
                {availableColumns.map(c => (
                  <option key={`${c.table}.${c.name}`} value={c.name}>
                    {c.table}.{c.name}
                  </option>
                ))}
              </select>
              <span className={styles.removeChip} onClick={() => removeGroupBy(i)}>✕</span>
            </div>
          ))}
          <button className={styles.addBtn} onClick={addGroupBy}>+ Add Dimension</button>
        </div>
      </div>
    </div>
  );
}
