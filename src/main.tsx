import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { Nav, SaveWarning, useRoute } from './components';
import { useLedger } from './store';
import Overview from './pages/Overview';
import Containers from './pages/Containers';
import Costs from './pages/Costs';
import Quality from './pages/Quality';
import Sales from './pages/Sales';
import Vendors from './pages/Vendors';
import Settings from './pages/Settings';

const PAGES: Record<string, () => JSX.Element> = {
  '': Overview, containers: Containers, costs: Costs, quality: Quality,
  sales: Sales, vendors: Vendors, settings: Settings,
};

function App() {
  const route = useRoute();
  const { company } = useLedger();
  const Page = PAGES[route] ?? Overview;
  return (
    <div className="flex min-h-screen">
      <Nav company={company.name} route={PAGES[route] ? route : ''} />
      <main className="min-w-0 flex-1 px-5 py-8 pt-16 lg:px-10 lg:py-10">
        <SaveWarning />
        <Page />
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
