import { useCallback } from 'react';
import { executeQuery } from '../services/apiService';
import { useQuery } from '../context/QueryContext';
import { useApp } from '../context/AppContext';

export function useQueryExecution() {
  const { setQueryResult, setIsExecuting } = useQuery();
  const { addNotification } = useApp();

  const runQuery = useCallback(async (sql) => {
    if (!sql?.trim()) {
      addNotification('Query is empty', 'error');
      return;
    }
    setIsExecuting(true);
    setQueryResult(null);
    try {
      const result = await executeQuery(sql);
      setQueryResult(result);
      addNotification(`Query completed — ${result.rowCount} rows in ${result.executionTime}ms`, 'success');
    } catch (err) {
      addNotification(`Query failed: ${err.message}`, 'error');
      setQueryResult({ error: err.message });
    } finally {
      setIsExecuting(false);
    }
  }, [setQueryResult, setIsExecuting, addNotification]);

  return { runQuery };
}
