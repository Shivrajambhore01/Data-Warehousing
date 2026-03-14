/**
 * High-Fidelity Demo Data for DataForge
 * Provides realistic analytical structures without a backend.
 */

export const MOCK_CATALOGS = {
  main_catalog: {
    ecommerce: [
      {
        name: 'fact_sales',
        rowCount: 450230,
        sizeBytes: 1024 * 1024 * 42,
        columns: [
          { name: 'transaction_id', type: 'UUID', description: 'Unique identifier for each sale', primaryKey: true },
          { name: 'customer_id', type: 'UUID', description: 'Reference to dim_customers', nullable: false },
          { name: 'product_id', type: 'UUID', description: 'Reference to dim_products', nullable: false },
          { name: 'store_id', type: 'INTEGER', description: 'Physical store ID' },
          { name: 'amount_usd', type: 'DECIMAL(12,2)', description: 'Gross transaction value' },
          { name: 'tax_amount', type: 'DECIMAL(12,2)', description: 'Tax applied to transaction' },
          { name: 'shipping_cost', type: 'DECIMAL(12,2)', description: 'Cost of shipping' },
          { name: 'transaction_date', type: 'TIMESTAMP', description: 'When the sale occurred' },
          { name: 'status', type: 'VARCHAR(20)', description: 'completed, pending, or returned' }
        ]
      },
      {
        name: 'dim_customers',
        rowCount: 85000,
        columns: [
          { name: 'customer_id', type: 'UUID', description: 'Primary Key', primaryKey: true },
          { name: 'first_name', type: 'VARCHAR(50)', description: 'Customer first name' },
          { name: 'last_name', type: 'VARCHAR(50)', description: 'Customer last name' },
          { name: 'email', type: 'VARCHAR(100)', description: 'Primary contact email' },
          { name: 'customer_region', type: 'VARCHAR(50)', description: 'North America, EMEA, APAC' },
          { name: 'loyalty_tier', type: 'VARCHAR(20)', description: 'gold, silver, bronze' },
          { name: 'signup_date', type: 'DATE', description: 'When the customer joined' }
        ]
      },
      {
        name: 'dim_products',
        rowCount: 12400,
        columns: [
          { name: 'product_id', type: 'UUID', description: 'Primary Key', primaryKey: true },
          { name: 'product_name', type: 'VARCHAR(255)', description: 'Full commercial name' },
          { name: 'category', type: 'VARCHAR(50)', description: 'Electronics, Apparel, Home' },
          { name: 'base_price', type: 'DECIMAL(10,2)', description: 'MSRP price' },
          { name: 'inventory_count', type: 'INTEGER', description: 'Current stock level' }
        ]
      }
    ],
    inventory: [
      {
        name: 'stock_levels',
        rowCount: 125000,
        columns: [
          { name: 'warehouse_id', type: 'INTEGER', description: 'Warehouse identifier' },
          { name: 'product_id', type: 'UUID', description: 'Reference to product' },
          { name: 'quantity', type: 'INTEGER', description: 'Current quantity on hand' },
          { name: 'last_restock_date', type: 'TIMESTAMP', description: 'Date of last delivery' }
        ]
      },
      {
        name: 'warehouses',
        rowCount: 45,
        columns: [
          { name: 'warehouse_id', type: 'INTEGER', description: 'Primary Key', primaryKey: true },
          { name: 'location_city', type: 'VARCHAR(100)', description: 'City location' },
          { name: 'capacity_sqft', type: 'INTEGER', description: 'Total storage area' }
        ]
      }
    ]
  },
  marketing_db: {
    campaigns: [
      {
        name: 'ad_spend',
        rowCount: 15600,
        columns: [
          { name: 'campaign_id', type: 'UUID' },
          { name: 'spend_usd', type: 'DECIMAL(10,2)' },
          { name: 'impressions', type: 'INTEGER' },
          { name: 'clicks', type: 'INTEGER' },
          { name: 'report_date', type: 'DATE' }
        ]
      },
      {
        name: 'conversions',
        rowCount: 4200,
        columns: [
          { name: 'conversion_id', type: 'UUID' },
          { name: 'campaign_id', type: 'UUID' },
          { name: 'customer_id', type: 'UUID' },
          { name: 'value_usd', type: 'DECIMAL(10,2)' }
        ]
      }
    ]
  }
};

export const INITIAL_SAVED_QUERIES = [
  {
    id: '1',
    name: 'Monthly Revenue Growth',
    description: 'Calculates MoM revenue growth faceted by customer region.',
    sql: `-- Monthly Revenue Growth\nSELECT \n  t2.customer_region,\n  DATE_TRUNC('month', t1.transaction_date) AS month,\n  SUM(t1.amount_usd) AS revenue\nFROM fact_sales t1\nJOIN dim_customers t2 ON t1.customer_id = t2.customer_id\nGROUP BY 1, 2\nORDER BY 2 DESC;`,
    tags: ['Revenue', 'Monthly', 'Regional'],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString()
  },
  {
    id: '2',
    name: 'Top Performing Products',
    description: 'Lists top 10 products by total sales volume in the last 30 days.',
    sql: `SELECT \n  p.product_name,\n  p.category,\n  COUNT(*) as units_sold,\n  SUM(s.amount_usd) as total_sales\nFROM fact_sales s\nJOIN dim_products p ON s.product_id = p.product_id\nWHERE s.transaction_date > CURRENT_DATE - INTERVAL '30 days'\nGROUP BY 1, 2\nORDER BY 4 DESC\nLIMIT 10;`,
    tags: ['Products', 'Growth'],
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString()
  },
  {
    id: '3',
    name: 'Inventory Alert - Low Stock',
    description: 'Identifies products with less than 50 units remaining in large warehouses.',
    sql: `SELECT \n  w.location_city,\n  p.product_name,\n  s.quantity\nFROM stock_levels s\nJOIN dim_products p ON s.product_id = p.product_id\nJOIN warehouses w ON s.warehouse_id = w.warehouse_id\nWHERE s.quantity < 50\n  AND w.capacity_sqft > 100000\nORDER BY 3 ASC;`,
    tags: ['Inventory', 'Alerts'],
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

export const INITIAL_HISTORY = [
  {
    id: 'h1',
    sql: 'SELECT * FROM fact_sales LIMIT 100;',
    executedAt: new Date(Date.now() - 3600000).toISOString(),
    status: 'success',
    rowCount: 100,
    executionTime: 245
  },
  {
    id: 'h2',
    sql: 'SELECT count(*) FROM dim_customers WHERE loyalty_tier = \'gold\';',
    executedAt: new Date(Date.now() - 7200000).toISOString(),
    status: 'success',
    rowCount: 1,
    executionTime: 112
  },
  {
    id: 'h3',
    sql: 'SELECT name FROM invalid_table;',
    executedAt: new Date(Date.now() - 10800000).toISOString(),
    status: 'error',
    rowCount: 0,
    executionTime: 45
  }
];

export function generateMockResult(sql) {
  // Simple logic to generate somewhat realistic results based on keywords
  const isCount = sql.toUpperCase().includes('COUNT');
  const isSales = sql.toUpperCase().includes('SALES');
  const isCust = sql.toUpperCase().includes('CUSTOMER');
  
  if (isCount) {
    const val = Math.floor(Math.random() * 10000);
    return {
      columns: [{ name: 'count', type: 'BIGINT' }],
      rows: [[val]],
      rowCount: 1,
      executionTime: 85
    };
  }
  
  if (isSales) {
    return {
      columns: [
        { name: 'transaction_id', type: 'UUID' },
        { name: 'amount_usd', type: 'DECIMAL' },
        { name: 'status', type: 'VARCHAR' }
      ],
      rows: Array.from({ length: 15 }, (_, i) => [
        `txn_${1000 + i}`,
        (Math.random() * 500).toFixed(2),
        Math.random() > 0.1 ? 'completed' : 'returned'
      ]),
      rowCount: 15,
      executionTime: 120
    };
  }

  // Default generic results
  return {
    columns: [
      { name: 'id', type: 'INTEGER' },
      { name: 'name', type: 'VARCHAR' },
      { name: 'value', type: 'DOUBLE' }
    ],
    rows: Array.from({ length: 10 }, (_, i) => [
      i + 1,
      `Demo Item ${i + 1}`,
      (Math.random() * 100).toFixed(4)
    ]),
    rowCount: 10,
    executionTime: 95
  };
}
