import React, { useEffect, useState } from 'react';
import { useQuery } from '../../context/QueryContext';
import { generateSQL } from '../../utils/sqlGenerator';
import { useQueryExecution } from '../../hooks/useQueryExecution';
import styles from './SQLPreview.module.css';

// Simple SQL syntax highlighting
function highlightSQL(sql) {
  const keywords = /\b(SELECT|FROM|WHERE|INNER|LEFT|RIGHT|FULL|JOIN|ON|AND|OR|NOT|IN|LIKE|AS|GROUP BY|ORDER BY|LIMIT|HAVING|DISTINCT|COUNT|SUM|AVG|MAX|MIN|DATE_TRUNC|COALESCE|CASE|WHEN|THEN|ELSE|END|DESC|ASC|NULL|TRUE|FALSE|IS|BY)\b/gi;
  const strings = /'[^']*'/g;
  const numbers = /\b\d+(\.\d+)?\b/g;
  const comments = /--[^\n]*/g;

  return sql
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(comments, m => `<span class="sql-comment">${m}</span>`)
    .replace(strings, m => `<span class="sql-string">${m}</span>`)
    .replace(keywords, m => `<span class="sql-keyword">${m.toUpperCase()}</span>`)
    .replace(numbers, m => `<span class="sql-number">${m}</span>`);
}

export default function SQLPreview({ editable = false }) {
  const { queryConfig, sqlPreview, setSqlPreview } = useQuery();
  const { runQuery } = useQueryExecution();
  const { isExecuting } = useQuery();
  const [copied, setCopied] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editSQL, setEditSQL] = useState('');

  useEffect(() => {
    const generated = generateSQL(queryConfig);
    setSqlPreview(generated);
    setEditSQL(generated);
  }, [queryConfig, setSqlPreview]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editMode ? editSQL : sqlPreview);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRun = () => {
    runQuery(editMode ? editSQL : sqlPreview);
  };

  const displaySQL = editMode ? editSQL : sqlPreview;
  const highlighted = highlightSQL(displaySQL);

  return (
    <div className={styles.wrap}>
      <div className={styles.header}>
        <div className={styles.title}>
          <span className={styles.dot} />
          Generated SQL
        </div>
        <div className={styles.actions}>
          {editable && (
            <button
              className={`${styles.actionBtn} ${editMode ? styles.activeBtn : ''}`}
              onClick={() => setEditMode(e => !e)}
            >
              {editMode ? '⊠ Lock' : '✎ Edit'}
            </button>
          )}
          <button className={styles.actionBtn} onClick={handleCopy}>
            {copied ? '✓ Copied' : '⎘ Copy'}
          </button>
          <button
            className={`${styles.runBtn} ${isExecuting ? styles.running : ''}`}
            onClick={handleRun}
            disabled={isExecuting}
          >
            {isExecuting ? (
              <><span className={styles.spinner} /> Running...</>
            ) : (
              <>▶ Execute</>
            )}
          </button>
        </div>
      </div>

      <div className={styles.editorWrap}>
        {editMode ? (
          <textarea
            className={styles.textarea}
            value={editSQL}
            onChange={e => setEditSQL(e.target.value)}
            spellCheck={false}
          />
        ) : (
          <pre
            className={styles.code}
            dangerouslySetInnerHTML={{ __html: highlighted }}
          />
        )}
      </div>
    </div>
  );
}
