import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { QueryProvider } from './context/QueryContext';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import QueryBuilderPage from './pages/QueryBuilderPage';
import SQLLabPage from './pages/SQLLabPage';
import CatalogExplorerPage from './pages/CatalogExplorerPage';
import QueryHistoryPage from './pages/QueryHistoryPage';
import SavedQueriesPage from './pages/SavedQueriesPage';
import './styles/globals.css';

function App() {
  return (
    <BrowserRouter>
      <AppProvider>
        <QueryProvider>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="query-builder" element={<QueryBuilderPage />} />
              <Route path="sql-lab" element={<SQLLabPage />} />
              <Route path="catalog" element={<CatalogExplorerPage />} />
              <Route path="history" element={<QueryHistoryPage />} />
              <Route path="saved" element={<SavedQueriesPage />} />
            </Route>
          </Routes>
        </QueryProvider>
      </AppProvider>
    </BrowserRouter>
  );
}

export default App;
