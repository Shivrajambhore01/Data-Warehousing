import React, { createContext, useContext, useState, useCallback } from 'react';

const QueryContext = createContext(null);

const initialState = {
  leftTable: '',
  rightTable: '',
  joinType: 'INNER JOIN',
  joinConditions: [{ leftCol: '', rightCol: '' }],
  aggregations: [],
  groupBy: [],
  filters: [],
  orderBy: '',
  orderDir: 'DESC',
  limit: 1000,
  builderStep: 'join', // Active step in the visual builder
  cdsViews: [], // Virtual columns/CDS definitions
};

export function QueryProvider({ children }) {
  const [queryConfig, setQueryConfig] = useState(initialState);
  const [queryResult, setQueryResult] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [sqlPreview, setSqlPreview] = useState('');

  const updateConfig = useCallback((updates) => {
    setQueryConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const resetConfig = useCallback(() => {
    setQueryConfig(initialState);
    setQueryResult(null);
    setSqlPreview('');
  }, []);

  const clearResult = useCallback(() => {
    setQueryResult(null);
  }, []);

  return (
    <QueryContext.Provider value={{
      queryConfig, updateConfig, resetConfig,
      queryResult, setQueryResult, clearResult,
      isExecuting, setIsExecuting,
      sqlPreview, setSqlPreview,
    }}>
      {children}
    </QueryContext.Provider>
  );
}

export function useQuery() {
  const ctx = useContext(QueryContext);
  if (!ctx) throw new Error('useQuery must be inside QueryProvider');
  return ctx;
}
