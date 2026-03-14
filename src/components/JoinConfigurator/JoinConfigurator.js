import React from 'react';
import { useQuery } from '../../context/QueryContext';
import { useTables } from '../../hooks/useTables';
import styles from './JoinConfigurator.module.css';

const JOIN_TYPES = ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL JOIN'];

function getTableByPath(catalogs, path) {
  for (const schemas of Object.values(catalogs)) {
    for (const tbls of Object.values(schemas)) {
      const match = tbls.find(t => t.name === path);
      if (match) return match;
    }
  }
  return null;
}

function flattenTables(catalogs) {
  const tables = [];
  for (const schemas of Object.values(catalogs)) {
    for (const tbls of Object.values(schemas)) {
      for (const t of tbls) tables.push(t.name);
    }
  }
  return tables;
}

export default function JoinConfigurator() {
  const { queryConfig, updateConfig } = useQuery();
  const { catalogs } = useTables();
  const tables = flattenTables(catalogs);

  const { leftTable, rightTable, joinType, joinConditions } = queryConfig;

  const updateCondition = (i, field, value) => {
    const updated = joinConditions.map((c, idx) =>
      idx === i ? { ...c, [field]: value } : c
    );
    updateConfig({ joinConditions: updated });
  };

  const leftCols = getTableByPath(catalogs, leftTable)?.columns || [];
  const rightCols = getTableByPath(catalogs, rightTable)?.columns || [];

  const addCondition = () =>
    updateConfig({ joinConditions: [...joinConditions, { leftCol: '', rightCol: '' }] });

  const removeCondition = (i) =>
    updateConfig({ joinConditions: joinConditions.filter((_, idx) => idx !== i) });

  return (
    <div className={styles.wrap}>
      {/* Table selectors */}
      <div className={styles.tableRow}>
        <div className={styles.tableSelect}>
          <label className={styles.label}>Left Table</label>
          <select
            className={styles.select}
            value={leftTable}
            onChange={e => updateConfig({ leftTable: e.target.value })}
          >
            <option value="">-- select table --</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className={styles.joinTypePicker}>
          {JOIN_TYPES.map(jt => (
            <button
              key={jt}
              className={`${styles.joinBtn} ${joinType === jt ? styles.active : ''}`}
              onClick={() => updateConfig({ joinType: jt })}
              title={jt}
            >
              ⊕
            </button>
          ))}
        </div>

        <div className={styles.tableSelect}>
          <label className={styles.label}>Right Table</label>
          <select
            className={styles.select}
            value={rightTable}
            onChange={e => updateConfig({ rightTable: e.target.value })}
          >
            <option value="">-- select table --</option>
            {tables.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      <div className={styles.conditions}>
        {joinConditions.map((cond, i) => (
          <div key={i} className={styles.conditionRow}>
            <span className={styles.onLabel}>ON</span>
            <select
              className={styles.condSelect}
              value={cond.leftCol}
              onChange={e => updateCondition(i, 'leftCol', e.target.value)}
            >
              <option value="">-- {leftTable || 't1'} column --</option>
              {leftCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            <span className={styles.equals}>=</span>
            <select
              className={styles.condSelect}
              value={cond.rightCol}
              onChange={e => updateCondition(i, 'rightCol', e.target.value)}
            >
              <option value="">-- {rightTable || 't2'} column --</option>
              {rightCols.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
            {i === joinConditions.length - 1 && (
              <button className={styles.addBtn} onClick={addCondition}>+ Add condition</button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
