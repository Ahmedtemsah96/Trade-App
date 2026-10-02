import React, { useState, useEffect } from 'react';
import { initDB } from './db';
import Dashboard from './pages/Dashboard';
import Containers from './pages/Containers';
import Costs from './pages/Costs';
import Quality from './pages/Quality';
import Sales from './pages/Sales';
import Vendors from './pages/Vendors';
import Settings from './pages/Settings';
import './App.css';

type Page = 'dashboard' | 'containers' | 'costs' | 'quality' | 'sales' | 'vendors' | 'settings';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initDB().then(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <nav className="sidebar">
        <div className="logo">CONTAINER LEDGER</div>
        <ul>
          <li>
            <button onClick={() => setPage('dashboard')} className={page === 'dashboard' ? 'active' : ''}>
              Overview
            </button>
          </li>
          <li>
            <button onClick={() => setPage('containers')} className={page === 'containers' ? 'active' : ''}>
              Containers
            </button>
          </li>
          <li>
            <button onClick={() => setPage('costs')} className={page === 'costs' ? 'active' : ''}>
              Costs
            </button>
          </li>
          <li>
            <button onClick={() => setPage('quality')} className={page === 'quality' ? 'active' : ''}>
              Quality
            </button>
          </li>
          <li>
            <button onClick={() => setPage('sales')} className={page === 'sales' ? 'active' : ''}>
              Sales
            </button>
          </li>
          <li>
            <button onClick={() => setPage('vendors')} className={page === 'vendors' ? 'active' : ''}>
              Vendors
            </button>
          </li>
          <li>
            <button onClick={() => setPage('settings')} className={page === 'settings' ? 'active' : ''}>
              Settings
            </button>
          </li>
        </ul>
      </nav>

      <main className="content">
        {page === 'dashboard' && <Dashboard />}
        {page === 'containers' && <Containers />}
        {page === 'costs' && <Costs />}
        {page === 'quality' && <Quality />}
        {page === 'sales' && <Sales />}
        {page === 'vendors' && <Vendors />}
        {page === 'settings' && <Settings />}
      </main>
    </div>
  );
}
