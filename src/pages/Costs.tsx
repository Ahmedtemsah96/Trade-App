import React, { useState, useEffect } from 'react';
import { query, insert, delete_ } from '../db';

interface CostEntry {
  id: string;
  container_id: string;
  cost_type: string;
  amount: number;
  currency: string;
  fx_rate: number;
  vendor_id?: string;
  document_ref?: string;
  description?: string;
  entry_date?: string;
  created_at?: string;
}

interface Container {
  id: string;
  container_number: string;
}

export default function Costs() {
  const [costs, setCosts] = useState<CostEntry[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    container_id: '',
    cost_type: 'goods',
    amount: '',
    currency: 'SAR',
    fx_rate: '1',
    document_ref: '',
    description: '',
  });

  const COST_TYPES = [
    ['goods', 'Goods / supplier invoice'],
    ['ocean_freight', 'Ocean freight'],
    ['agent_fee', 'Agent fee'],
    ['clearance', 'Customs clearance'],
    ['port_charges', 'Port charges'],
    ['inland_transport', 'Inland transport'],
    ['penalty', 'Penalty / demurrage'],
    ['fermentation', 'Fermentation'],
    ['labor', 'Labour'],
    ['overhead', 'Overhead'],
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [costsData, containersData] = await Promise.all([
      query<CostEntry>('cost_entries'),
      query<Container>('containers'),
    ]);
    setCosts(costsData.sort((a, b) => new Date(b.entry_date || '').getTime() - new Date(a.entry_date || '').getTime()).slice(0, 300));
    setContainers(containersData.sort((a, b) => a.container_number.localeCompare(b.container_number)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newCost: CostEntry = {
      id: crypto.randomUUID(),
      container_id: form.container_id,
      cost_type: form.cost_type,
      amount: parseFloat(form.amount) || 0,
      currency: form.currency,
      fx_rate: parseFloat(form.fx_rate) || 1,
      document_ref: form.document_ref,
      description: form.description,
      entry_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    await insert('cost_entries', newCost);
    loadData();
    setForm({ container_id: '', cost_type: 'goods', amount: '', currency: 'SAR', fx_rate: '1', document_ref: '', description: '' });
    setShowForm(false);
  };

  return (
    <div>
      <h1>Costs</h1>
      <p className="subtitle">Post goods, freight, agent fees, clearance, port, transport, penalty, fermentation, labour, overhead.</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Add cost</button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New cost entry</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Container</label>
              <select
                required
                value={form.container_id}
                onChange={(e) => setForm({ ...form, container_id: e.target.value })}
              >
                <option value="">Select container</option>
                {containers.map((c) => (
                  <option key={c.id} value={c.id}>{c.container_number}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Cost type</label>
              <select
                value={form.cost_type}
                onChange={(e) => setForm({ ...form, cost_type: e.target.value })}
              >
                {COST_TYPES.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount</label>
              <input
                type="number"
                required
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
              >
                <option value="SAR">SAR</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
            <div className="form-group">
              <label>FX Rate</label>
              <input
                type="number"
                step="0.0001"
                value={form.fx_rate}
                onChange={(e) => setForm({ ...form, fx_rate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Document ref</label>
              <input
                value={form.document_ref}
                onChange={(e) => setForm({ ...form, document_ref: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              style={{ height: '80px' }}
            />
          </div>
          <button type="submit">Save cost</button>
          <button type="button" className="secondary" onClick={() => setShowForm(false)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Container</th>
            <th>Type</th>
            <th>Amount</th>
            <th>Currency</th>
            <th>Vendor</th>
            <th>Ref</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {costs.map((c) => (
            <tr key={c.id}>
              <td>{c.entry_date || '—'}</td>
              <td>{c.container_id}</td>
              <td>{c.cost_type}</td>
              <td>{c.amount.toFixed(2)}</td>
              <td>{c.currency}</td>
              <td>{c.vendor_id || '—'}</td>
              <td>{c.document_ref || '—'}</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => { delete_(('cost_entries', c.id)); loadData(); }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
