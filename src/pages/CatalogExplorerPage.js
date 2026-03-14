import React, { useState } from 'react';
import TableExplorer from '../components/TableExplorer/TableExplorer';
import { useTableDetails } from '../hooks/useTables';
import { formatBytes, formatRows, typeColor } from '../utils/sqlGenerator';
import styles from './CatalogExplorerPage.module.css';

export default function CatalogExplorerPage() {
  const [selected, setSelected] = useState(null);
  const { details, loading } = useTableDetails(
    selected?.catalog, selected?.schema, selected?.name
  );

  return (
    <div className={styles.page}>
      {/* Left: tree */}
      <div className={styles.leftPanel}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>▤ Data Catalog</span>
        </div>
        <TableExplorer onSelectTable={setSelected} />
      </div>

      {/* Right: details */}
      <div className={styles.rightPanel}>
        {!selected ? (
          <div className={styles.emptyState}>
            <span className={styles.emptyIcon}>▤</span>
            <div className={styles.emptyTitle}>Select a table to explore</div>
            <div className={styles.emptyDesc}>Browse the catalog tree on the left to view table metadata, columns, and schema details.</div>
          </div>
        ) : loading ? (
          <div className={styles.loadingState}>
            <span className={styles.spinner} />
            Loading table details...
          </div>
        ) : details ? (
          <TableDetailView details={details} />
        ) : (
          <div className={styles.emptyState}>Failed to load table details</div>
        )}
      </div>
    </div>
  );
}

function TableDetailView({ details }) {
  const [activeTab, setActiveTab] = useState('columns');

  return (
    <div className={styles.detailView}>
      {/* Header */}
      <div className={styles.detailHeader}>
        <div className={styles.tableNameRow}>
          <span className={styles.tableIcon}>▦</span>
          <span className={styles.tableName}>{details.name}</span>
          <span className={styles.schemaBadge}>{details.catalog}.{details.schema}</span>
        </div>
        {details.description && (
          <div className={styles.tableDesc}>{details.description}</div>
        )}
        <div className={styles.tableMeta}>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Rows</span>
            <span className={styles.metaVal}>{formatRows(details.rowCount)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Size</span>
            <span className={styles.metaVal}>{formatBytes(details.sizeBytes)}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Columns</span>
            <span className={styles.metaVal}>{details.columns.length}</span>
          </div>
          <div className={styles.metaItem}>
            <span className={styles.metaLabel}>Created</span>
            <span className={styles.metaVal}>{new Date(details.createdAt).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {['columns', 'preview', 'ddl'].map(t => (
          <button
            key={t}
            className={`${styles.tab} ${activeTab === t ? styles.activeTab : ''}`}
            onClick={() => setActiveTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className={styles.tabContent}>
        {activeTab === 'columns' && <ColumnsTab columns={details.columns} />}
        {activeTab === 'preview' && <PreviewTab name={details.name} columns={details.columns} />}
        {activeTab === 'ddl' && <DDLTab details={details} />}
      </div>
    </div>
  );
}

function ColumnsTab({ columns }) {
  return (
    <div className={styles.columnsWrap}>
      <table className={styles.colTable}>
        <thead>
          <tr>
            <th className={styles.colTh}>#</th>
            <th className={styles.colTh}>Column Name</th>
            <th className={styles.colTh}>Type</th>
            <th className={styles.colTh}>Nullable</th>
            <th className={styles.colTh}>PK</th>
          </tr>
        </thead>
        <tbody>
          {columns.map((col, i) => (
            <tr key={col.name} className={styles.colTr}>
              <td className={`${styles.colTd} ${styles.colIdx}`}>{i + 1}</td>
              <td className={`${styles.colTd} ${styles.colName}`}>
                {col.primaryKey && <span className={styles.pkBadge}>PK</span>}
                {col.name}
              </td>
              <td className={styles.colTd}>
                <span className={styles.typeBadge} style={{ color: typeColor(col.type) }}>
                  {col.type}
                </span>
              </td>
              <td className={styles.colTd}>
                <span className={col.nullable ? styles.yes : styles.no}>
                  {col.nullable ? 'YES' : 'NO'}
                </span>
              </td>
              <td className={styles.colTd}>
                {col.primaryKey ? <span className={styles.pkIcon}>⬡</span> : '—'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PreviewTab({ name, columns }) {
  const sampleCols = columns.slice(0, 6);
  const rows = Array.from({ length: 8 }, (_, i) => {
    const row = {};
    sampleCols.forEach(col => {
      if (col.type.includes('INT')) row[col.name] = Math.floor(Math.random() * 10000);
      else if (col.type.includes('DECIMAL') || col.type.includes('FLOAT')) row[col.name] = (Math.random() * 5000).toFixed(2);
      else if (col.type.includes('DATE')) row[col.name] = `2024-0${i + 1}-15`;
      else if (col.type.includes('BOOL')) row[col.name] = Math.random() > 0.5 ? 'true' : 'false';
      else row[col.name] = `sample_${i + 1}`;
    });
    return row;
  });

  return (
    <div className={styles.previewWrap}>
      <div className={styles.previewNote}>
        Sample preview (first 8 rows, {sampleCols.length} of {columns.length} columns)
      </div>
      <div className={styles.previewTableWrap}>
        <table className={styles.colTable}>
          <thead>
            <tr>
              {sampleCols.map(c => <th key={c.name} className={styles.colTh}>{c.name}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className={styles.colTr}>
                {sampleCols.map(c => (
                  <td key={c.name} className={styles.colTd}>{String(row[c.name])}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function DDLTab({ details }) {
  const ddl = `CREATE TABLE ${details.schema}.${details.name} (\n${
    details.columns.map(c =>
      `  ${c.name.padEnd(30)} ${c.type}${c.primaryKey ? ' PRIMARY KEY' : ''}${!c.nullable ? ' NOT NULL' : ''}`
    ).join(',\n')
  }\n);`;

  return (
    <div className={styles.ddlWrap}>
      <pre className={styles.ddlCode}>{ddl}</pre>
    </div>
  );
}
