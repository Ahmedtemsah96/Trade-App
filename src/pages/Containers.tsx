import React, { useState, useEffect } from 'react';
import { query, insert, delete_ } from '../db';

interface Container {
  id: string;
  container_number: string;
  cartons_received: number;
  origin?: string;
  destination_port?: string;
  stage?: string;
  notes?: string;
  created_at?: string;
}

export default function Containers() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    container_number: '',
    cartons_received: '',
    origin: '',
    destination_port: '',
    notes: '',
  });

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    const data = await query<Container>('containers');
    setContainers(data.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime()));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newContainer: Container = {
      id: crypto.randomUUID(),
      container_number: form.container_number.toUpperCase(),
      cartons_received: parseInt(form.cartons_received) || 0,
      origin: form.origin,
      destination_port: form.destination_port,
      stage: 'in_transit',
      notes: form.notes,
      created_at: new Date().toISOString(),
    };
    await insert('containers', newContainer);
    loadContainers();
    setForm({ container_number: '', cartons_received: '', origin: '', destination_port: '', notes: '' });
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this container?')) {
      await delete_('containers', id);
      loadContainers();
    }
  };

  return (
    <div>
      <h1>Containers</h1>
      <p className="subtitle">Each container opens its own cost centre. Everything you post later attaches to one of these.</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Register container</button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New container</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Container number</label>
              <input
                required
                placeholder="SEGU9970606"
                value={form.container_number}
                onChange={(e) => setForm({ ...form, container_number: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Cartons received</label>
              <input
                type="number"
                value={form.cartons_received}
                onChange={(e) => setForm({ ...form, cartons_received: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Origin</label>
              <input
                value={form.origin}
                onChange={(e) => setForm({ ...form, origin: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Destination port</label>
              <input
                value={form.destination_port}
                onChange={(e) => setForm({ ...form, destination_port: e.target.value })}
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
          <button type="submit">Save container</button>
          <button type="button" className="secondary" onClick={() => setShowForm(false)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Container</th>
            <th>Cartons</th>
            <th>Origin</th>
            <th>Destination</th>
            <th>Stage</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.container_number}</strong></td>
              <td>{c.cartons_received}</td>
              <td>{c.origin || '—'}</td>
              <td>{c.destination_port || '—'}</td>
              <td>{c.stage || 'in_transit'}</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => handleDelete(c.id)}
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
