import React, { useState, useEffect } from 'react';
import { query, insert, delete_ } from '../db';

interface Vendor {
  id: string;
  name: string;
  kind: string;
  country?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  payment_terms_days?: number;
  opening_balance: number;
  created_at?: string;
}

export default function Vendors() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: '',
    kind: 'supplier',
    country: '',
    contact_person: '',
    email: '',
    phone: '',
    payment_terms_days: '30',
    opening_balance: '',
  });

  useEffect(() => {
    loadVendors();
  }, []);

  const loadVendors = async () => {
    const data = await query<Vendor>('vendors');
    setVendors(data.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = {
      id: crypto.randomUUID(),
      name: form.name,
      kind: form.kind,
      country: form.country,
      contact_person: form.contact_person,
      email: form.email,
      phone: form.phone,
      payment_terms_days: parseInt(form.payment_terms_days) || 30,
      opening_balance: parseFloat(form.opening_balance) || 0,
      created_at: new Date().toISOString(),
    };
    await insert('vendors', newVendor);
    loadVendors();
    setForm({ name: '', kind: 'supplier', country: '', contact_person: '', email: '', phone: '', payment_terms_days: '30', opening_balance: '' });
    setShowForm(false);
  };

  return (
    <div>
      <h1>Vendors</h1>
      <p className="subtitle">Balance = opening + invoiced − paid, per vendor, with payment records.</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Add vendor</button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New vendor</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={form.kind}
                onChange={(e) => setForm({ ...form, kind: e.target.value })}
              >
                <option value="supplier">Supplier</option>
                <option value="shipping">Shipping</option>
                <option value="clearance">Clearance</option>
                <option value="transport">Transport</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Country</label>
              <input
                value={form.country}
                onChange={(e) => setForm({ ...form, country: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Contact person</label>
              <input
                value={form.contact_person}
                onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Payment terms (days)</label>
              <input
                type="number"
                value={form.payment_terms_days}
                onChange={(e) => setForm({ ...form, payment_terms_days: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Opening balance (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={form.opening_balance}
                onChange={(e) => setForm({ ...form, opening_balance: e.target.value })}
              />
            </div>
          </div>
          <button type="submit">Save vendor</button>
          <button type="button" className="secondary" onClick={() => setShowForm(false)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Type</th>
            <th>Country</th>
            <th>Contact</th>
            <th>Email</th>
            <th>Terms</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {vendors.map((v) => (
            <tr key={v.id}>
              <td><strong>{v.name}</strong></td>
              <td>{v.kind}</td>
              <td>{v.country || '—'}</td>
              <td>{v.contact_person || '—'}</td>
              <td>{v.email || '—'}</td>
              <td>{v.payment_terms_days} days</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => { delete_('vendors', v.id); loadVendors(); }}
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
