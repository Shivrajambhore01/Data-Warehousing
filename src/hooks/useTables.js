import { useState, useEffect } from 'react';
import { fetchAllTables, fetchTableDetails } from '../services/apiService';

export function useTables() {
  const [catalogs, setCatalogs] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAllTables()
      .then(data => setCatalogs(data.catalogs))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return { catalogs, loading, error };
}

export function useTableDetails(catalog, schema, table) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!catalog || !schema || !table) return;
    setLoading(true);
    fetchTableDetails(catalog, schema, table)
      .then(setDetails)
      .catch(() => setDetails(null))
      .finally(() => setLoading(false));
  }, [catalog, schema, table]);

  return { details, loading };
}
