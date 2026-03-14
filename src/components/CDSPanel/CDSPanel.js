import React from 'react';
import { useQuery } from '../../context/QueryContext';
import styles from './CDSPanel.module.css';

export default function CDSPanel() {
  const { queryConfig, updateConfig } = useQuery();
  const { cdsViews = [] } = queryConfig;

  const handleAddView = () => {
    updateConfig({
      cdsViews: [...cdsViews, { id: Date.now(), name: '', expression: '', description: '' }]
    });
  };

  const handleUpdateView = (id, updates) => {
    updateConfig({
      cdsViews: cdsViews.map(v => v.id === id ? { ...v, ...updates } : v)
    });
  };

  const handleRemoveView = (id) => {
    updateConfig({
      cdsViews: cdsViews.filter(v => v.id !== id)
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleInfo}>
          <h3>✦ Virtual Columns & CDS Views</h3>
          <p>Define calculated expressions and complex business logic here.</p>
        </div>
        <button className={styles.addBtn} onClick={handleAddView}>+ Add Column</button>
      </div>

      <div className={styles.viewsList}>
        {cdsViews.length === 0 ? (
          <div className={styles.empty}>
            No virtual columns defined. Use virtual columns to create complex expressions like <code>CASE</code> or <code>CAST</code>.
          </div>
        ) : (
          cdsViews.map(view => (
            <div key={view.id} className={styles.viewCard}>
              <div className={styles.cardHeader}>
                <input 
                  type="text" 
                  placeholder="Column Alias (e.g. total_margin)" 
                  value={view.name}
                  onChange={e => handleUpdateView(view.id, { name: e.target.value })}
                  className={styles.nameInput}
                />
                <button className={styles.removeBtn} onClick={() => handleRemoveView(view.id)}>×</button>
              </div>
              <div className={styles.cardBody}>
                <textarea 
                  placeholder="SQL Expression (e.g. amount - cost)" 
                  value={view.expression}
                  onChange={e => handleUpdateView(view.id, { expression: e.target.value })}
                  className={styles.expressionInput}
                />
                <input 
                  type="text" 
                  placeholder="Description (optional)" 
                  value={view.description}
                  onChange={e => handleUpdateView(view.id, { description: e.target.value })}
                  className={styles.descInput}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
