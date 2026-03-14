import React, { useState } from 'react';
import { useTables } from '../../hooks/useTables';
import { fetchTableDetails } from '../../services/apiService';
import styles from './SchemaBrowser.module.css';

const Icon = ({ type }) => {
  switch (type) {
    case 'catalog': return <span className={styles.iconCatalog}>☁</span>;
    case 'schema':  return <span className={styles.iconSchema}>▤</span>;
    case 'table':   return <span className={styles.iconTable}>▦</span>;
    case 'folder':  return <span className={styles.iconFolder}>🗀</span>;
    case 'column':  return <span className={styles.iconColumn}>▸</span>;
    case 'pk':      return <span className={styles.iconPk}>🔑</span>;
    default:        return null;
  }
};

const TableNode = ({ catalog, schema, table, onSelectTable, onSelectColumn, search }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [columnsOpen, setColumnsOpen] = useState(false);
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async (e) => {
    e.stopPropagation();
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState && !details) {
      setLoading(true);
      try {
        const data = await fetchTableDetails(catalog, schema, table.name);
        setDetails(data);
      } catch (err) {
        console.error('Failed to load table details', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleTableClick = (e) => {
    e.stopPropagation();
    onSelectTable?.({ catalog, schema, ...table });
  };

  const handleColumnClick = (e, col) => {
    e.stopPropagation();
    onSelectColumn?.(col.name);
  };

  return (
    <div className={styles.tableNode}>
      <div className={`${styles.treeRow} ${styles.tableRow}`} onClick={toggle}>
        <span className={`${styles.squareToggle} ${isOpen ? styles.open : ''}`}>
          <span className={styles.toggleArrow}>▶</span>
        </span>
        <span className={styles.nodeName} onClick={handleTableClick}>{table.name}</span>
        <span className={styles.rowCount}>{table.rowCount?.toLocaleString()}</span>
      </div>
      
      {isOpen && (
        <div className={styles.virtualFolders}>
          <div className={styles.virtualFolder}>
            <div className={styles.treeRow} onClick={() => setColumnsOpen(!columnsOpen)}>
              <span className={`${styles.squareToggle} ${columnsOpen ? styles.open : ''}`}>
                <span className={styles.toggleArrow}>▶</span>
              </span>
              <span className={styles.nodeName}>Columns</span>
            </div>

            {columnsOpen && (
              <div className={styles.columnList}>
                {loading ? (
                  <div className={styles.loadingTiny}>Loading...</div>
                ) : details?.columns?.map(col => (
                  <div 
                    key={col.name} 
                    className={`${styles.treeRow} ${styles.columnRow}`}
                    onClick={(e) => handleColumnClick(e, col)}
                  >
                    <span className={styles.squareToggle}>
                      <span className={styles.columnMarker}>•</span>
                    </span>
                    <span className={styles.colName}>{col.name}</span>
                    <span className={styles.colType}>{col.type}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function SchemaBrowser({ onSelectTable, onSelectColumn }) {
  const { catalogs, loading, error } = useTables();
  const [expanded, setExpanded] = useState({});
  const [search, setSearch] = useState('');

  const toggle = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  if (loading) return (
    <div className={styles.state}>
      <span className={styles.spinner} />
      <span>Loading warehouse...</span>
    </div>
  );

  if (error) return (
    <div className={styles.state}>
      <span className={styles.errorIcon}>⚠</span>
      <span>{error}</span>
    </div>
  );

  return (
    <div className={styles.container}>
      <div className={styles.searchBox}>
        <span className={styles.searchIcon}>⌕</span>
        <input
          className={styles.searchInput}
          placeholder="Filter schemas, tables..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      <div className={styles.tree}>
        {Object.entries(catalogs).map(([catalogName, schemas]) => {
          const catKey = `cat-${catalogName}`;
          const catOpen = expanded[catKey] !== false;
          
          return (
            <div key={catalogName} className={styles.catalogNode}>
              <div className={styles.treeRow} onClick={() => toggle(catKey)}>
                <span className={`${styles.squareToggle} ${catOpen ? styles.open : ''}`}>
                  <span className={styles.toggleArrow}>›</span>
                </span>
                <span className={styles.nodeName}>{catalogName}</span>
              </div>

              {catOpen && Object.entries(schemas).map(([schemaName, tables]) => {
                const schKey = `sch-${catalogName}-${schemaName}`;
                const schOpen = expanded[schKey] !== false;
                const tblsKey = `tbls-${catalogName}-${schemaName}`;
                const tblsOpen = expanded[tblsKey] !== false;
                
                const filteredTables = tables.filter(t => 
                  !search || t.name.toLowerCase().includes(search.toLowerCase())
                );
                
                if (search && filteredTables.length === 0) return null;

                return (
                  <div key={schemaName} className={styles.schemaNode}>
                    <div className={styles.treeRow} onClick={() => toggle(schKey)}>
                      <span className={`${styles.squareToggle} ${schOpen ? styles.open : ''}`}>
                        <span className={styles.toggleArrow}>›</span>
                      </span>
                      <span className={styles.nodeName}>{schemaName}</span>
                    </div>

                    {schOpen && (
                      <div className={styles.virtualFolders}>
                        <div className={styles.virtualFolder}>
                          <div className={styles.treeRow} onClick={() => toggle(tblsKey)}>
                            <span className={`${styles.squareToggle} ${tblsOpen ? styles.open : ''}`}>
                              <span className={styles.toggleArrow}>›</span>
                            </span>
                            <span className={styles.nodeName}>Tables</span>
                          </div>

                          {tblsOpen && (
                            <div className={styles.tableList}>
                              {filteredTables.map(table => (
                                <TableNode
                                  key={table.name}
                                  catalog={catalogName}
                                  schema={schemaName}
                                  table={table}
                                  onSelectTable={onSelectTable}
                                  onSelectColumn={onSelectColumn}
                                  search={search}
                                />
                              ))}
                            </div>
                          )}
                        </div>
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
