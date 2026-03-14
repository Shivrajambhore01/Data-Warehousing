import React, { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '../context/QueryContext';
import { useQueryExecution } from '../hooks/useQueryExecution';
import ResultTable from '../components/ResultTable/ResultTable';
import SchemaBrowser from '../components/SchemaBrowser/SchemaBrowser';
import { saveQuery } from '../services/apiService';
import { useApp } from '../context/AppContext';
import { useTables } from '../hooks/useTables';
import styles from './SQLLabPage.module.css';

const SQL_KEYWORDS = [
  'SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT JOIN', 'RIGHT JOIN', 
  'INNER JOIN', 'ON', 'GROUP BY', 'ORDER BY', 'LIMIT', 'HAVING', 'AS', 
  'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN', 'DESC', 'ASC', 'CASE', 
  'WHEN', 'THEN', 'ELSE', 'END', 'CAST', 'COALESCE', 'DATE_TRUNC', 'WITH'
];

const SQL_TEMPLATES = [
  { name: 'Select All', sql: 'SELECT * FROM tablename LIMIT 100;' },
  { name: 'Aggregation', sql: 'SELECT column, COUNT(*) \nFROM tablename \nGROUP BY 1 \nORDER BY 2 DESC;' },
  { name: 'Join Tables', sql: 'SELECT t1.*, t2.*\nFROM table1 t1\nINNER JOIN table2 t2 ON t1.id = t2.id\nLIMIT 100;' },
  { name: 'Filter Top 10', sql: 'SELECT *\nFROM tablename\nWHERE status = \'completed\'\nORDER BY created_at DESC\nLIMIT 10;' }
];

function validateSQL(sql) {
  if (!sql) return null;
  const s = sql.trim().toUpperCase();
  if (s && !s.startsWith('SELECT') && !s.startsWith('INSERT') && !s.startsWith('UPDATE') && !s.startsWith('DELETE') && !s.startsWith('CREATE') && !s.startsWith('WITH') && !s.startsWith('--') && !s.startsWith('/*')) {
    return 'Query must start with a valid SQL keyword (e.g., SELECT)';
  }
  const quotes = (sql.match(/'/g) || []).length;
  if (quotes % 2 !== 0) return 'Syntax Error: Unbalanced single quotes detected';
  
  if (s.includes('SELECT') && !s.includes('FROM')) {
    if (!s.includes('SELECT VERSION()') && !s.includes('SELECT 1')) { // edge cases
      return 'Syntax Error: Missing FROM clause in SELECT query';
    }
  }
  return null;
}

function formatSQL(sql) {
  if (!sql) return '';
  return sql
    .replace(/\s+/g, ' ')
    .replace(/\b(SELECT|FROM|WHERE|LEFT|RIGHT|INNER|OUTER|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT|UNION|INSERT|UPDATE|DELETE|SET)\b/gi, '\n$1')
    .trim();
}

function highlightSQL(sql) {
  if (!sql) return '';
  // Enhanced Regex for Theme 2.0
  const keywords = /\b(SELECT|FROM|WHERE|INNER|LEFT|RIGHT|FULL|JOIN|ON|AND|OR|NOT|IN|LIKE|AS|GROUP BY|ORDER BY|LIMIT|HAVING|DISTINCT|DESC|ASC|WITH|UNION|INTERSECT|EXCEPT|CASE|WHEN|THEN|ELSE|END)\b/gi;
  const modifiers = /\b(INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|GRANT|REVOKE)\b/gi;
  const functions = /\b(COUNT|SUM|AVG|MAX|MIN|DATE_TRUNC|COALESCE|IFNULL|NULLIF|ROUND|CAST|CONCAT)\b/gi;
  const strings = /'[^']*'|"[^"]*"/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const comments = /(--[^\n]*|\/\*[\s\S]*?\*\/)/g;
  
  return sql
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(comments, m => `<span class="sql-comment">${m}</span>`)
    .replace(strings, m => `<span class="sql-string">${m}</span>`)
    .replace(modifiers, m => `<span class="sql-modifier">${m.toUpperCase()}</span>`)
    .replace(functions, m => `<span class="sql-function">${m.toUpperCase()}</span>`)
    .replace(keywords, m => `<span class="sql-keyword">${m.toUpperCase()}</span>`)
    .replace(numbers, m => `<span class="sql-number">${m}</span>`);
}

const DEFAULT_SQL = `-- DataForge SQL Lab
-- Write your SQL query below and press Execute (⌘Enter)

SELECT
    t2.customer_region,
    DATE_TRUNC('month', t1.transaction_date) AS transaction_month,
    SUM(t1.amount_usd) AS total_revenue,
    COUNT(*) AS order_count
FROM fact_sales t1
INNER JOIN dim_customers t2
    ON t1.customer_id = t2.customer_id
WHERE t1.status = 'completed'
GROUP BY 1, 2
ORDER BY 2 DESC
LIMIT 500`;

export default function SQLLabPage() {
  const location = useLocation();
  const [tabs, setTabs] = useState(() => {
    const saved = localStorage.getItem('sql_lab_tabs');
    return saved ? JSON.parse(saved) : [
      { id: '1', title: 'Query 1', sql: location.state?.sql || DEFAULT_SQL, results: null, isExecuting: false, resultsTab: 'table', database: 'main_catalog' }
    ];
  });

  useEffect(() => {
    localStorage.setItem('sql_lab_tabs', JSON.stringify(tabs.map(t => ({ ...t, results: null, isExecuting: false }))));
  }, [tabs]);
  const [activeTabId, setActiveTabId] = useState('1');
  const [showSave, setShowSave] = useState(false);
  const [saveName, setSaveName] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [showCatalog, setShowCatalog] = useState(true);
  const [catalogWidth, setCatalogWidth] = useState(280);
  const [resultsHeight, setResultsHeight] = useState(300);
  const [isResizingH, setIsResizingH] = useState(false);
  const [isResizingV, setIsResizingV] = useState(false);
  const [cursorPos, setCursorPos] = useState({ line: 0, ch: 0 });
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionIndex, setSuggestionIndex] = useState(0);
  const [suggestionPos, setSuggestionPos] = useState({ top: 0, left: 0 });
  const [validationError, setValidationError] = useState(null);

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const textareaRef = useRef(null);
  const highlightRef = useRef(null);
  
  const { isExecuting: globalExecuting, queryResult: globalResult, clearResult } = useQuery();
  const { runQuery: globalRunQuery } = useQueryExecution();
  const { addNotification } = useApp();
  const { tables } = useTables();

  // Sync global execution results to the active tab
  useEffect(() => {
    if (globalResult && activeTab.isExecuting) {
      setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: globalResult, isExecuting: false } : t));
      if (clearResult) clearResult(); // Clean up global state to prevent bleed
    }
  }, [globalResult, activeTabId, activeTab.isExecuting, clearResult]);

  useEffect(() => {
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, isExecuting: globalExecuting } : t));
  }, [globalExecuting, activeTabId]);

  const handleRunQuery = (sql) => {
    const error = validateSQL(sql);
    if (error) {
      setValidationError(error);
      addNotification(error, 'error');
      return;
    }
    setValidationError(null);
    // Reset local results for this tab before running
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, results: null, isExecuting: true } : t));
    globalRunQuery(sql);
  };

  const handleAddTab = () => {
    const newId = Date.now().toString();
    const newTab = { id: newId, title: `Query ${tabs.length + 1}`, sql: '', results: null, isExecuting: false, resultsTab: 'table', database: activeTab.database };
    setTabs([...tabs, newTab]);
    setActiveTabId(newId);
  };

  const handleCloseTab = (id, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  const updateActiveSql = (newSql) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, sql: newSql } : t));
  };

  const updateActiveResultsTab = (newTab) => {
    setTabs(tabs.map(t => t.id === activeTabId ? { ...t, resultsTab: newTab } : t));
  };

  const handleResizeH = (e) => {
    e.preventDefault();
    setIsResizingH(true);
    const startX = e.clientX;
    const startWidth = catalogWidth;
    const onMove = (me) => {
      const maxWidth = window.innerWidth * 0.4;
      const newWidth = Math.max(160, Math.min(maxWidth, startWidth + (me.clientX - startX)));
      setCatalogWidth(newWidth);
    };
    const onUp = () => {
      setIsResizingH(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const handleResizeV = (e) => {
    e.preventDefault();
    setIsResizingV(true);
    const startY = e.clientY;
    const startHeight = resultsHeight;
    const onMove = (me) => setResultsHeight(Math.max(100, Math.min(window.innerHeight - 200, startHeight - (me.clientY - startY))));
    const onUp = () => {
      setIsResizingV(false);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  // Sync scroll between textarea and highlight overlay
  const syncScroll = () => {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  useEffect(() => {
    syncScroll();
  }, [activeTab.sql]);

  const handleKeyDown = (e) => {
    // Cmd/Ctrl+Enter to run selected or all
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      e.preventDefault();
      const selection = window.getSelection().toString();
      handleRunQuery(selection || activeTab.sql);
    }
    // Cmd/Ctrl+S to save
    if ((e.metaKey || e.ctrlKey) && e.key === 's') {
      e.preventDefault();
      setShowSave(true);
    }
    // Ctrl+Shift+F to format
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      updateActiveSql(formatSQL(activeTab.sql));
    }
    // Ctrl+N for new tab
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      handleAddTab();
    }
    // Autocomplete Navigation
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(i => (i + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(i => (i - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setSuggestions([]);
        return;
      }
    }
    // Tab insertion
    if (e.key === 'Tab') {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      const newSQL = activeTab.sql.substring(0, start) + '    ' + activeTab.sql.substring(end);
      updateActiveSql(newSQL);
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
        }
      }, 0);
    }
  };

  const applySuggestion = (s) => {
    const start = textareaRef.current.selectionStart;
    const textBefore = activeTab.sql.substring(0, start);
    const lastWord = textBefore.split(/\s+/).pop();
    const newSQL = textBefore.substring(0, textBefore.length - lastWord.length) + s + activeTab.sql.substring(start);
    updateActiveSql(newSQL);
    setSuggestions([]);
    setTimeout(() => {
      textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start - lastWord.length + s.length;
    }, 0);
  };

  const handleCursorChange = (e) => {
    const textBefore = e.target.value.substring(0, e.target.selectionStart);
    const lines = textBefore.split('\n');
    setCursorPos({ line: lines.length - 1, ch: lines[lines.length - 1].length });
    
    // Autocomplete Logic
    const lastWord = textBefore.split(/[\s,()]+/).pop();
    if (lastWord.length >= 2) {
      const tableNames = tables?.map(t => t.name) || [];
      const columnNames = Array.from(new Set(tables?.flatMap(t => t.columns?.map(c => c.name) || []) || []));
      
      const filtered = [...SQL_KEYWORDS, ...tableNames, ...columnNames]
        .filter(k => k.toLowerCase().startsWith(lastWord.toLowerCase()) && k.toLowerCase() !== lastWord.toLowerCase())
        .slice(0, 10);
      
      if (filtered.length > 0) {
        setSuggestions(filtered);
        setSuggestionIndex(0);
        // Position suggestion box roughly based on cursor
        const lineOffset = (lines.length - 1) * 24 + 24; // line height + padding
        const chOffset = lines[lines.length - 1].length * 8 + 24; // approx char width + padding
        setSuggestionPos({ top: lineOffset, left: chOffset });
      } else {
        setSuggestions([]);
      }
    } else {
      setSuggestions([]);
    }
  };

  const handleSave = async () => {
    if (!saveName.trim()) return;
    try {
      await saveQuery({ name: saveName, sql: activeTab.sql, description: saveDescription });
      addNotification(`Query saved: ${saveName}`, 'success');
      setShowSave(false);
      setSaveName('');
      setSaveDescription('');
    } catch (e) {
      addNotification('Failed to save query', 'error');
    }
  };

  const lineCount = activeTab.sql.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');

  return (
    <div className={`${styles.page} ${isResizingH ? styles.resizingH : ''} ${isResizingV ? styles.resizingV : ''}`}>
      {/* Sidebar: Catalog Explorer */}
      <div 
        className={`${styles.sidebar} ${!showCatalog ? styles.sidebarHidden : ''}`} 
        style={{ width: showCatalog ? catalogWidth : 0 }}
      >
        <div className={styles.sidebarContent}>
          <div className={styles.sidebarHeader}>
            <span className={styles.sidebarTitle}>Schema Browser</span>
            <button 
              className={styles.sidebarToggle} 
              onClick={() => setShowCatalog(false)}
              title="Collapse sidebar"
            >
              ⟨
            </button>
          </div>
          <SchemaBrowser 
            onSelectTable={(t) => {
              updateActiveSql(activeTab.sql + `\n-- Table: ${t.name}\nSELECT * FROM ${t.schema}.${t.name} LIMIT 10;`);
              if (t.catalog) {
                setTabs(prev => prev.map(tab => tab.id === activeTabId ? { ...tab, database: t.catalog } : tab));
              }
            }} 
            onSelectColumn={(colName) => updateActiveSql(activeTab.sql + (activeTab.sql.trim() ? ', ' : '') + colName)}
          />
        </div>
        <div className={styles.resizerH} onMouseDown={handleResizeH} />
      </div>

      <div className={styles.mainContent}>
        {/* Editor panel */}
        <div className={styles.editorPanel}>
          <div className={styles.editorHeader}>
            <div className={styles.editorToolbar}>
              {!showCatalog && (
                <button 
                  className={styles.toolbarBtn}
                  onClick={() => setShowCatalog(true)}
                  title="Open Catalog"
                >
                  ▦
                </button>
              )}
              <div className={styles.dbIndicator}>
                <span className={styles.dbIcon}>☁</span>
                <span className={styles.dbLabel}>Connected:</span>
                <span className={styles.dbName}>{activeTab.database || 'main_catalog'}</span>
              </div>
            </div>
            <div className={styles.editorActions}>
              <div className={styles.snippetDropdown}>
                <button className={styles.secondaryBtn}>📑 Templates</button>
                <div className={styles.snippetMenu}>
                  {SQL_TEMPLATES.map(tmp => (
                    <div 
                      key={tmp.name} 
                      className={styles.snippetItem}
                      onClick={() => updateActiveSql(activeTab.sql + (activeTab.sql.trim() ? '\n\n' : '') + tmp.sql)}
                    >
                      {tmp.name}
                    </div>
                  ))}
                </div>
              </div>
              <button 
                className={styles.secondaryBtn} 
                onClick={() => updateActiveSql(formatSQL(activeTab.sql))}
                title="Format SQL (Ctrl+Shift+F)"
              >
                ✨ Format
              </button>
              <button className={styles.runBtn} onClick={() => setShowSave(s => !s)}>
                <span className={styles.runBtnIcon}>💾</span>
                Save Query
              </button>
            </div>
          </div>

          {/* Tab Bar */}
          <div className={styles.tabBar}>
            <div className={styles.tabsScroll}>
              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`${styles.editorTab} ${activeTabId === tab.id ? styles.activeTab : ''}`}
                  onClick={() => setActiveTabId(tab.id)}
                >
                  <span className={styles.tabIcon}>⚡</span>
                  <span className={styles.tabTitle}>{tab.title}</span>
                  {tab.isExecuting && <span className={styles.tabLoading}>...</span>}
                  {tabs.length > 1 && (
                    <button 
                      className={styles.closeTabBtn}
                      onClick={(e) => handleCloseTab(tab.id, e)}
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button className={styles.addTabBtn} onClick={handleAddTab} title="New query tab">+</button>
            </div>
          </div>

          {/* Save Modal Overlay */}
          {showSave && (
            <div className={styles.saveOverlay} onClick={() => setShowSave(false)}>
              <div className={styles.saveModal} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                  <span className={styles.modalTitle}>Save Query</span>
                  <button className={styles.modalClose} onClick={() => setShowSave(false)}>×</button>
                </div>
                
                <div className={styles.modalBody}>
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Query Name</label>
                    <input
                      className={styles.modalInput}
                      placeholder="Give your query a memorable name..."
                      value={saveName}
                      onChange={e => setSaveName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleSave()}
                      autoFocus
                    />
                  </div>
                  
                  <div className={styles.fieldGroup}>
                    <label className={styles.fieldLabel}>Description (Optional)</label>
                    <textarea
                      className={styles.modalTextarea}
                      placeholder="Describe what this query calculates or its intended use case..."
                      value={saveDescription}
                      onChange={e => setSaveDescription(e.target.value)}
                    />
                  </div>
                </div>
                
                <div className={styles.modalFooter}>
                  <button className={styles.cancelBtn} onClick={() => setShowSave(false)}>Cancel</button>
                  <button className={styles.confirmSaveBtn} onClick={handleSave}>
                    Save Query
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Notebook Cell Transformation */}
          <div className={styles.cellContainer}>
            <div className={styles.cellHeader}>
              <div className={styles.cellIndex}>[ {tabs.indexOf(activeTab) + 1} ]</div>
              <div className={styles.cellControls}>
                <button className={styles.cellIconBtn} title="Move Up">↑</button>
                <button className={styles.cellIconBtn} title="Move Down">↓</button>
                <button className={styles.cellIconBtn} title="Edit Title">✎</button>
                <button className={styles.cellIconBtn} title="Delete Cell" onClick={(e) => handleCloseTab(activeTab.id, e)}>🗑</button>
                <button className={styles.cellIconBtn}>⋮</button>
              </div>
            </div>
            
            <div className={styles.editorBody}>
              <div className={styles.gutter}>
                <button 
                  className={`${styles.playButton} ${activeTab.isExecuting ? styles.isPlaying : ''} ${validationError ? styles.invalid : ''}`}
                  onClick={() => handleRunQuery(activeTab.sql)}
                  disabled={activeTab.isExecuting}
                >
                  {activeTab.isExecuting ? '⌛' : '▶'}
                </button>
                <pre className={styles.lineNums}>{lineNumbers}</pre>
              </div>
              
              <div className={styles.editorContent}>
                {validationError && (
                  <div className={styles.validationBanner}>
                    ⚠️ {validationError}
                  </div>
                )}
                <pre
                  ref={highlightRef}
                  className={styles.highlight}
                  aria-hidden="true"
                >
                  {highlightSQL(activeTab.sql).split('\n').map((line, i) => (
                    <div 
                      key={i} 
                      className={`${styles.highlightLine} ${cursorPos.line === i ? styles.activeLine : ''}`}
                      dangerouslySetInnerHTML={{ __html: line + (i === lineCount - 1 ? '' : '\n') }}
                    />
                  ))}
                </pre>
                <textarea
                  ref={textareaRef}
                  className={styles.textarea}
                  value={activeTab.sql}
                  onChange={e => updateActiveSql(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onKeyUp={handleCursorChange}
                  onClick={handleCursorChange}
                  onScroll={syncScroll}
                  spellCheck={false}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                />
                
                {suggestions.length > 0 && (
                  <div 
                    className={styles.suggestionOverlay}
                    style={{ top: suggestionPos.top, left: suggestionPos.left }}
                  >
                    {suggestions.map((s, i) => (
                      <div 
                        key={s} 
                        className={`${styles.suggestionItem} ${i === suggestionIndex ? styles.activeSuggestion : ''}`}
                        onClick={() => applySuggestion(s)}
                      >
                        {s}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Execution Status Bar */}
            <div className={styles.executionStatus}>
              {activeTab.isExecuting ? (
                <div className={styles.statusLive}>
                  <span className={styles.spinnerTiny} />
                  Running query...
                </div>
              ) : activeTab.results ? (
                <div className={styles.statusSummary}>
                  <span className={activeTab.results.error ? styles.statusErr : styles.statusOk}>
                    {activeTab.results.error ? '❌ Failed' : '✓ Success'}
                  </span>
                  <span className={styles.statusDivider}>|</span>
                  <span>{activeTab.results.rowCount ?? 0} rows</span>
                  <span className={styles.statusDivider}>|</span>
                  <span>{activeTab.results.executionTime}ms</span>
                </div>
              ) : (
                <div className={styles.statusIdle}>Ready</div>
              )}
              <div className={styles.editorShortcuts}>
                <span>Ctrl+Enter: Run</span>
                <span>Ctrl+S: Save</span>
              </div>
            </div>
          </div>
        </div>

        {/* Results panel */}
        <div className={styles.resizerV} onMouseDown={handleResizeV} />
        <div className={styles.resultsPanel} style={{ height: resultsHeight }}>
          <div className={styles.resultsHeader}>
            <div className={styles.resultsTabs}>
              <button 
                className={`${styles.resTab} ${activeTab.resultsTab === 'table' ? styles.active : ''}`}
                onClick={() => updateActiveResultsTab('table')}
              >
                ▦ Table
              </button>
              <button 
                className={`${styles.resTab} ${activeTab.resultsTab === 'chart' ? styles.active : ''}`}
                onClick={() => updateActiveResultsTab('chart')}
              >
                ıl Chart
              </button>
            </div>
            {activeTab.results && !activeTab.results.error && (
              <div className={styles.statusInfo}>
                <span className={styles.statusSuccess}>✓ Completed in {activeTab.results.executionTime}ms</span>
                <span>{activeTab.results.rowCount} rows</span>
                <button className={styles.iconBtn}>⤓</button>
              </div>
            )}
          </div>
          <div className={styles.resultsBody}>
            {activeTab.isExecuting ? (
              <div className={styles.loadingState}>
                <div className={styles.spinner} />
                <p>Executing query...</p>
              </div>
            ) : activeTab.results ? (
              activeTab.resultsTab === 'table' ? (
                <ResultTable results={activeTab.results} />
              ) : (
                <div className={styles.chartPlaceholder}>
                  <div className={styles.chartBars}>
                    <div className={styles.bar} style={{ height: '60%' }} />
                    <div className={styles.bar} style={{ height: '85%' }} />
                    <div className={styles.bar} style={{ height: '45%' }} />
                    <div className={styles.bar} style={{ height: '95%' }} />
                    <div className={styles.bar} style={{ height: '70%' }} />
                  </div>
                  <div className={styles.chartNote}>Data Visualization View</div>
                </div>
              )
            ) : (
              <div className={styles.emptyState}>
                <p>Run a query to see results</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
