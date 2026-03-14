import { MOCK_CATALOGS, INITIAL_SAVED_QUERIES, INITIAL_HISTORY, generateMockResult } from './mockData';

// Simulated latency to feel realistic
const sleep = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

// Persistence helper for demo mode
const getStore = (key, initial) => {
  const saved = localStorage.getItem(`df_${key}`);
  if (!saved) {
    localStorage.setItem(`df_${key}`, JSON.stringify(initial));
    return initial;
  }
  return JSON.parse(saved);
};

const saveStore = (key, data) => {
  localStorage.setItem(`df_${key}`, JSON.stringify(data));
};

// --- Mock API Implementations ---

export const fetchAllTables = async () => {
  await sleep(300);
  return { catalogs: MOCK_CATALOGS };
};

export const fetchTableDetails = async (catalog, schema, table) => {
  await sleep(200);
  const schemaList = MOCK_CATALOGS[catalog]?.[schema];
  if (!schemaList) return null;
  const match = schemaList.find(t => t.name === table);
  if (!match) return null;

  return { 
    ...match,
    catalog, 
    schema, 
    sizeBytes: match.sizeBytes || Math.floor(Math.random() * 1024 * 1024 * 50) + 1024 * 512,
    createdAt: match.createdAt || new Date(Date.now() - 86400000 * 30).toISOString(),
    description: match.description || `Core data asset representing ${table} within the ${schema} domain.`
  };
};

export const executeQuery = async (sql, limit = 1000) => {
  await sleep(600 + Math.random() * 400); // Surgical delay
  const results = generateMockResult(sql);
  
  // Add a .rows property that is an alias for .length compatibility if needed, 
  // but better to just ensure components use .rowCount or we provide the array directly.
  // Actually, components like QueryBuilder use queryResult.length.
  // Let's make results the array itself OR ensure it has a length.
  
  const finalResult = {
    ...results,
    length: results.rowCount // For compatibility with components checking .length
  };
  
  // Add to history automatically
  const history = getStore('history', INITIAL_HISTORY);
  const newEntry = {
    id: `h_${Date.now()}`,
    sql,
    executedAt: new Date().toISOString(),
    status: 'success',
    rowCount: results.rowCount,
    executionTime: results.executionTime
  };
  saveStore('history', [newEntry, ...history]);
  
  return finalResult;
};

export const fetchHistory = async (page = 1, limit = 20) => {
  await sleep(200);
  const history = getStore('history', INITIAL_HISTORY);
  return { 
    history: history.slice((page - 1) * limit, page * limit),
    totalCount: history.length
  };
};

export const deleteHistory = async (id) => {
  await sleep(100);
  const history = getStore('history', INITIAL_HISTORY);
  saveStore('history', history.filter(h => h.id !== id));
  return { success: true };
};

export const fetchSaved = async () => {
  await sleep(300);
  return { queries: getStore('saved', INITIAL_SAVED_QUERIES) };
};

export const saveQuery = async (data) => {
  await sleep(400);
  const saved = getStore('saved', INITIAL_SAVED_QUERIES);
  const newQuery = {
    id: `s_${Date.now()}`,
    ...data,
    tags: data.tags || ['Demo'],
    createdAt: new Date().toISOString()
  };
  saveStore('saved', [newQuery, ...saved]);
  return newQuery;
};

export const deleteSaved = async (id) => {
  await sleep(200);
  const saved = getStore('saved', INITIAL_SAVED_QUERIES);
  saveStore('saved', saved.filter(s => s.id !== id));
  return { success: true };
};

export const checkHealth = async () => ({ status: 'demo_mode', version: '1.0.0-demo' });
