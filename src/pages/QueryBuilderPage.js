import React, { useState } from 'react';
import JoinConfigurator from '../components/JoinConfigurator/JoinConfigurator';
import AggregationPanel from '../components/AggregationPanel/AggregationPanel';
import CDSPanel from '../components/CDSPanel/CDSPanel';
import FilterPanel from '../components/FilterPanel/FilterPanel';
import SQLPreview from '../components/SQLPreview/SQLPreview';
import ResultTable from '../components/ResultTable/ResultTable';
import { useQuery } from '../context/QueryContext';
import styles from './QueryBuilderPage.module.css';

const STEPS = [
  { id: 'join',   label: '1. Join Tables',   icon: '⛓' },
  { id: 'agg',    label: '2. Aggregations',  icon: '∑' },
  { id: 'cds',    label: '3. Virtual Views', icon: '✦' },
  { id: 'refine', label: '4. Refine',        icon: '⊘' },
  { id: 'output', label: '5. Display',       icon: '▦' },
];

export default function QueryBuilderPage() {
  const { queryConfig, updateConfig, queryResult, isExecuting } = useQuery();

  const handleNext = () => {
    const currentIndex = STEPS.findIndex(s => s.id === queryConfig.builderStep);
    if (currentIndex < STEPS.length - 1) {
      updateConfig({ builderStep: STEPS[currentIndex + 1].id });
    }
  };

  const handlePrev = () => {
    const currentIndex = STEPS.findIndex(s => s.id === queryConfig.builderStep);
    if (currentIndex > 0) {
      updateConfig({ builderStep: STEPS[currentIndex - 1].id });
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.builderMain}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h1>Visual Query Builder <span>✎</span></h1>
            <p>Construct complex analytical queries with modular components.</p>
          </div>
          <div className={styles.headerActions}>
            <button className={styles.saveBtn}>💾 Save Setup</button>
            <button className={styles.executeBtn} disabled={isExecuting}>
              {isExecuting ? '⌛ Running...' : '▶ Execute Query'}
            </button>
          </div>
        </div>

        {/* Step Navigation Bar */}
        <div className={styles.stepBar}>
          {STEPS.map((step, idx) => (
            <div 
              key={step.id} 
              className={`${styles.stepItem} ${queryConfig.builderStep === step.id ? styles.activeStep : ''}`}
              onClick={() => updateConfig({ builderStep: step.id })}
            >
              <span className={styles.stepNum}>{idx + 1}</span>
              <span className={styles.stepIcon}>{step.icon}</span>
              <span className={styles.stepLabel}>{step.label}</span>
              {idx < STEPS.length - 1 && <span className={styles.stepArrow}>›</span>}
            </div>
          ))}
        </div>

        <div className={styles.builderScroll}>
          <div className={styles.builderLayout}>
            {/* Main setup area */}
            <div className={styles.builderSetup}>
              <div className={styles.module}>
                <div className={styles.moduleHeader}>
                  <div className={styles.moduleTitle}>
                    {STEPS.find(s => s.id === queryConfig.builderStep)?.label.toUpperCase()}
                  </div>
                  <div className={styles.navControls}>
                    <button 
                      className={styles.navBtn}
                      onClick={handlePrev} 
                      disabled={queryConfig.builderStep === 'join'}
                    >
                      ← Previous
                    </button>
                    <button 
                      className={`${styles.navBtn} ${styles.primaryNavBtn}`}
                      onClick={handleNext} 
                      disabled={queryConfig.builderStep === 'output'}
                    >
                      Next Step →
                    </button>
                  </div>
                </div>
                <div className={styles.moduleContent}>
                  {queryConfig.builderStep === 'join' && <JoinConfigurator />}
                  {queryConfig.builderStep === 'agg' && <AggregationPanel />}
                  {queryConfig.builderStep === 'cds' && <CDSPanel />}
                  {queryConfig.builderStep === 'refine' && <FilterPanel />}
                  {queryConfig.builderStep === 'output' && (
                    <div className={styles.outputView}>
                      {queryResult ? (
                        <ResultTable results={queryResult} />
                      ) : (
                        <div className={styles.placeholderView}>
                          <p>No results yet. Press <b>Execute Query</b> to see output here.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Right details sidebar - Field Inspector */}
            <div className={styles.detailsSidebar}>
              <div className={styles.inspectorTitle}>
                <span className={styles.inspectorIcon}>🖨</span>
                Field Inspector
              </div>
              
              {!queryConfig.leftTable ? (
                <div className={styles.infoCard}>
                  <p>Select a table to inspect available fields and their types.</p>
                </div>
              ) : (
                <div className={styles.inspectorList}>
                  <div className={styles.tableHeader}>
                    <span className={styles.tableName}>{queryConfig.leftTable}</span>
                    <span className={styles.tableBadge}>Source</span>
                  </div>
                  {/* We would ideally map columns here from useTables hook data */}
                  <div className={styles.infoCard}>
                    <span className={styles.catLabel}>ACTIVE FIELDS</span>
                    <p>Use the aggregation and filters to refine the fields shown here.</p>
                  </div>
                </div>
              )}

              <div className={styles.infoCard} style={{ marginTop: 'auto', border: 'none', background: 'rgba(245, 166, 35, 0.03)' }}>
                <h3 style={{ color: 'var(--accent)' }}>💡 Modeling Tip</h3>
                <p>Add <b>Virtual Columns</b> to create complex business logic like profit margins or combined strings without touching the raw data.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Live Preview Viewport */}
        {queryConfig.builderStep !== 'output' && (
          <div className={styles.livePreview}>
            <div className={styles.previewHeader}>
              <div className={styles.previewTitle}>
                <span className={styles.pulse} />
                Live Table Preview
              </div>
              <div className={styles.previewMeta}>
                {queryResult ? `${queryResult.rowCount} rows sample` : 'No data executed yet'}
              </div>
            </div>
            <div className={styles.previewContent}>
              {queryResult ? (
                <div className={styles.miniTable}>
                  <ResultTable results={queryResult} />
                </div>
              ) : (
                <div className={styles.previewEmpty}>
                  Press <b>Execute Query</b> to see live data here while you build.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Bottom Preview */}
        <div className={styles.previewPanel}>
          <SQLPreview />
        </div>
      </div>
    </div>
  );
}
