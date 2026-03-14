/**
 * Generates SQL from the visual query builder configuration
 */
export function generateSQL(config) {
  const {
    leftTable,
    rightTable,
    joinType,
    joinConditions,
    aggregations,
    groupBy,
    filters,
    orderBy,
    orderDir,
    limit,
    cdsViews,
  } = config;

  if (!leftTable) return '-- Select a table to start building your query';

  const t1 = 't1';
  const t2 = 't2';

  // SELECT clause
  const selectParts = [];
  groupBy.forEach(g => selectParts.push(`    ${t1}.${g}`));
  aggregations.forEach(a => {
    const alias = a.alias || `${a.func.toLowerCase()}_${a.column}`;
    let funcCall = `${a.func}(${t1}.${a.column})`;
    
    if (a.func === 'COUNT DISTINCT') {
      funcCall = `COUNT(DISTINCT ${t1}.${a.column})`;
    } else if (a.func === 'COALESCE_SUM') {
      funcCall = `COALESCE(SUM(${t1}.${a.column}), 0)`;
    }
    
    selectParts.push(`    ${funcCall} AS ${alias}`);
  });
  
  // CDS / Virtual Columns
  (cdsViews || []).forEach(v => {
    if (v.name && v.expression) {
      selectParts.push(`    ${v.expression} AS ${v.name}`);
    }
  });

  const selectClause = selectParts.length > 0
    ? selectParts.join(',\n')
    : `    ${t1}.*`;

  // FROM clause
  let fromClause = `FROM ${leftTable} ${t1}`;

  // JOIN clause
  if (rightTable) {
    const validConditions = joinConditions.filter(c => c.leftCol && c.rightCol);
    if (validConditions.length > 0) {
      const onClause = validConditions
        .map(c => `${t1}.${c.leftCol} = ${t2}.${c.rightCol}`)
        .join('\n    AND ');
      fromClause += `\n${joinType} ${rightTable} ${t2}\n    ON ${onClause}`;
    }
  }

  // WHERE clause
  let whereClause = '';
  const validFilters = filters.filter(f => f.column && f.operator && f.value !== '');
  if (validFilters.length > 0) {
    const conditions = validFilters.map(f => {
      const col = `${t1}.${f.column}`;
      if (f.operator === 'IN') return `${col} IN (${f.value})`;
      if (f.operator === 'LIKE') return `${col} LIKE '${f.value}'`;
      const isStr = isNaN(f.value) && !['true', 'false'].includes(f.value.toLowerCase());
      const val = isStr ? `'${f.value}'` : f.value;
      return `${col} ${f.operator} ${val}`;
    });
    whereClause = `WHERE ${conditions.join('\n  AND ')}`;
  }

  // GROUP BY clause
  let groupClause = '';
  if (groupBy.length > 0 && aggregations.length > 0) {
    groupClause = `GROUP BY ${groupBy.map((_, i) => i + 1).join(', ')}`;
  }

  // ORDER BY clause
  let orderClause = '';
  if (orderBy) {
    orderClause = `ORDER BY ${orderBy} ${orderDir}`;
  } else if (groupBy.length > 0) {
    orderClause = `ORDER BY 1 ASC`;
  }

  // LIMIT
  const limitClause = limit ? `LIMIT ${limit}` : '';

  const parts = [
    `SELECT\n${selectClause}`,
    fromClause,
    whereClause,
    groupClause,
    orderClause,
    limitClause,
  ].filter(Boolean);

  return parts.join('\n');
}

// Format bytes to human readable
export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

// Format row counts
export function formatRows(n) {
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// Format execution time
export function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Infer column type color
export function typeColor(type = '') {
  const t = type.toUpperCase();
  if (t.includes('INT') || t.includes('BIGINT')) return '#3dd6f5';
  if (t.includes('DECIMAL') || t.includes('FLOAT') || t.includes('NUMERIC')) return '#f5a623';
  if (t.includes('VARCHAR') || t.includes('TEXT') || t.includes('CHAR')) return '#2dc96a';
  if (t.includes('DATE') || t.includes('TIMESTAMP')) return '#b47ffc';
  if (t.includes('BOOL')) return '#f5554a';
  if (t.includes('JSON')) return '#f5a623';
  return '#8b93a8';
}
