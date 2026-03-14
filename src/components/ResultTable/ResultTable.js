import React, { useState } from 'react';
import { useQuery } from '../../context/QueryContext';
import { formatTime, typeColor } from '../../utils/sqlGenerator';
import styles from './ResultTable.module.css';

const PAGE_SIZE = 50;

export default function ResultTable({ results }) {
  const [page, setPage] = useState(1);

  if (!results) return (
    <div className={styles.state}>
      <span className={styles.stateIcon}>▶</span>
      <span>Run a query to see results here</span>
    </div>
  );

  if (results.error) return (
    <div className={`${styles.state} ${styles.errorState}`}>
      <span className={styles.stateIcon}>⚠</span>
      <div>
        <div className={styles.errorTitle}>Query Error</div>
        <code className={styles.errorMsg}>{results.error}</code>
      </div>
    </div>
  );

  const { columns = [], rows = [], rowCount, executionTime } = results;
  
  // Normalize columns to object array [{name, type}]
  const normalizedColumns = columns.map(col => 
    typeof col === 'string' ? { name: col, type: 'VARCHAR' } : col
  );

  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const exportCSV = () => {
    const header = normalizedColumns.map(c => c.name).join(',');
    const body = rows.map(row => normalizedColumns.map(c => `"${row[c.name] ?? ''}"`).join(',')).join('\n');
    const blob = new Blob([`${header}\n${body}`], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'query_result.csv'; a.click();
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(rows, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = 'query_result.json'; a.click();
  };

  return (
    <div className={styles.wrap}>
      {/* Stats bar */}
      <div className={styles.statsBar}>
        <div className={styles.stats}>
          <span className={styles.statItem}>
            <span className={styles.statDot} style={{ background: 'var(--success)' }} />
            <span className={styles.statVal}>{rowCount.toLocaleString()}</span> rows
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>
            <span className={styles.statVal}>{columns.length}</span> columns
          </span>
          <span className={styles.statSep}>·</span>
          <span className={styles.statItem}>
            <span className={styles.statVal}>{formatTime(executionTime)}</span>
          </span>
        </div>
        <div className={styles.exportBtns}>
          <button className={styles.exportBtn} onClick={exportCSV}>⬇ CSV</button>
          <button className={styles.exportBtn} onClick={exportJSON}>⬇ JSON</button>
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th className={`${styles.th} ${styles.rowNumTh}`}>#</th>
              {normalizedColumns.map(col => (
                <th key={col.name} className={styles.th}>
                  <div className={styles.thContent}>
                    <span className={styles.colName}>{col.name}</span>
                    <span className={styles.colType}>{col.type}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row, i) => (
              <tr key={i} className={styles.tr}>
                <td className={`${styles.td} ${styles.rowNum}`}>
                  {(page - 1) * PAGE_SIZE + i + 1}
                </td>
                {normalizedColumns.map(col => {
                  const val = row[col.name];
                  const isNull = val === null || val === undefined;
                  const isNum = !isNull && !isNaN(Number(val)) && val !== '';
                  return (
                    <td key={col.name} className={`${styles.td} ${isNum ? styles.numCell : ''}`}>
                      {isNull
                        ? <span className={styles.nullVal}>NULL</span>
                        : String(val)
                      }
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className={styles.pagination}>
          <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(1)}>«</button>
          <button className={styles.pageBtn} disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</button>
          <span className={styles.pageInfo}>Page {page} of {totalPages}</span>
          <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</button>
          <button className={styles.pageBtn} disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</button>
        </div>
      )}
    </div>
  );
}
