import React, { useState, useEffect } from 'react';
import { query, insert, delete_ } from '../db';

interface SalesEntry {
  id: string;
  container_id: string;
  cartons_sold: number;
  unit_price: number;
  amount: number;
  customer_name?: string;
  invoice_number?: string;
  vat_amount: number;
  sale_date?: string;
  notes?: string;
  created_at?: string;
}

interface Container {
  id: string;
  container_number: string;
}

export default function Sales() {
  const [sales, setSales] = useState<SalesEntry[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    container_id: '',
    cartons_sold: '',
    unit_price: '',
    customer_name: '',
    invoice_number: '',
    vat_amount: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [salesData, containersData] = await Promise.all([
      query<SalesEntry>('sales_entries'),
      query<Container>('containers'),
    ]);
    setSales(salesData.sort((a, b) => new Date(b.sale_date || '').getTime() - new Date(a.sale_date || '').getTime()).slice(0, 300));
    setContainers(containersData.sort((a, b) => a.container_number.localeCompare(b.container_number)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cartons = parseFloat(form.cartons_sold) || 0;
    const price = parseFloat(form.unit_price) || 0;
    const newSale: SalesEntry = {
      id: crypto.randomUUID(),
      container_id: form.container_id,
      cartons_sold: cartons,
      unit_price: price,
      amount: cartons * price,
      customer_name: form.customer_name,
      invoice_number: form.invoice_number,
      vat_amount: parseFloat(form.vat_amount) || 0,
      sale_date: new Date().toISOString().split('T')[0],
      notes: form.notes,
      created_at: new Date().toISOString(),
    };
    await insert('sales_entries', newSale);
    loadData();
    setForm({ container_id: '', cartons_sold: '', unit_price: '', customer_name: '', invoice_number: '', vat_amount: '', notes: '' });
    setShowForm(false);
  };

  return (
    <div>
      <h1>Sales</h1>
      <p className="subtitle">Cartons out, price, customer, invoice, output VAT.</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Add sale</button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New sale entry</h3>
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
              <label>Cartons sold</label>
              <input
                type="number"
                required
                value={form.cartons_sold}
                onChange={(e) => setForm({ ...form, cartons_sold: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Unit price (SAR)</label>
              <input
                type="number"
                required
                step="0.01"
                value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Customer</label>
              <input
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Invoice number</label>
              <input
                value={form.invoice_number}
                onChange={(e) => setForm({ ...form, invoice_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>VAT amount (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={form.vat_amount}
                onChange={(e) => setForm({ ...form, vat_amount: e.target.value })}
              />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              style={{ height: '80px' }}
            />
          </div>
          <button type="submit">Save sale</button>
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
            <th>Cartons</th>
            <th>Price/carton</th>
            <th>Total</th>
            <th>Customer</th>
            <th>Invoice</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {sales.map((s) => (
            <tr key={s.id}>
              <td>{s.sale_date || '—'}</td>
              <td>{s.container_id}</td>
              <td>{s.cartons_sold}</td>
              <td>SAR {s.unit_price.toFixed(2)}</td>
              <td>SAR {s.amount.toFixed(0)}</td>
              <td>{s.customer_name || '—'}</td>
              <td>{s.invoice_number || '—'}</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => { delete_('sales_entries', s.id); loadData(); }}
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
