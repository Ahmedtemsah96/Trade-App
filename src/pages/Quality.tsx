import React, { useState, useEffect } from 'react';
import { query, insert, delete_ } from '../db';

interface QualityEvent {
  id: string;
  container_id: string;
  event_type: string;
  damage_percent: number;
  affected_cartons: number;
  claim_received: number;
  inspected_by?: string;
  notes?: string;
  event_date?: string;
  created_at?: string;
}

interface Container {
  id: string;
  container_number: string;
}

export default function Quality() {
  const [events, setEvents] = useState<QualityEvent[]>([]);
  const [containers, setContainers] = useState<Container[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    container_id: '',
    event_type: 'insurance',
    damage_percent: '',
    affected_cartons: '',
    claim_received: '',
    inspected_by: '',
    notes: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [eventsData, containersData] = await Promise.all([
      query<QualityEvent>('quality_events'),
      query<Container>('containers'),
    ]);
    setEvents(eventsData.sort((a, b) => new Date(b.event_date || '').getTime() - new Date(a.event_date || '').getTime()).slice(0, 200));
    setContainers(containersData.sort((a, b) => a.container_number.localeCompare(b.container_number)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newEvent: QualityEvent = {
      id: crypto.randomUUID(),
      container_id: form.container_id,
      event_type: form.event_type,
      damage_percent: parseFloat(form.damage_percent) || 0,
      affected_cartons: parseInt(form.affected_cartons) || 0,
      claim_received: parseFloat(form.claim_received) || 0,
      inspected_by: form.inspected_by,
      notes: form.notes,
      event_date: new Date().toISOString().split('T')[0],
      created_at: new Date().toISOString(),
    };
    await insert('quality_events', newEvent);
    loadData();
    setForm({ container_id: '', event_type: 'insurance', damage_percent: '', affected_cartons: '', claim_received: '', inspected_by: '', notes: '' });
    setShowForm(false);
  };

  return (
    <div>
      <h1>Quality</h1>
      <p className="subtitle">Damage valued at container's own cost per carton, net of insurer claims.</p>

      {!showForm ? (
        <button onClick={() => setShowForm(true)}>Add quality event</button>
      ) : (
        <form onSubmit={handleSubmit} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New quality event</h3>
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
              <label>Event type</label>
              <select
                value={form.event_type}
                onChange={(e) => setForm({ ...form, event_type: e.target.value })}
              >
                <option value="insurance">Insurance</option>
                <option value="ripple">Ripple</option>
                <option value="market_salvage">Market salvage</option>
                <option value="total_loss">Total loss</option>
              </select>
            </div>
            <div className="form-group">
              <label>Damage %</label>
              <input
                type="number"
                step="0.01"
                value={form.damage_percent}
                onChange={(e) => setForm({ ...form, damage_percent: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Affected cartons</label>
              <input
                type="number"
                value={form.affected_cartons}
                onChange={(e) => setForm({ ...form, affected_cartons: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Claim received (SAR)</label>
              <input
                type="number"
                step="0.01"
                value={form.claim_received}
                onChange={(e) => setForm({ ...form, claim_received: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Inspected by</label>
              <input
                value={form.inspected_by}
                onChange={(e) => setForm({ ...form, inspected_by: e.target.value })}
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
          <button type="submit">Save event</button>
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
            <th>Damage %</th>
            <th>Cartons</th>
            <th>Claim</th>
            <th>Inspector</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td>{e.event_date || '—'}</td>
              <td>{e.container_id}</td>
              <td>{e.event_type}</td>
              <td>{e.damage_percent.toFixed(1)}%</td>
              <td>{e.affected_cartons}</td>
              <td>SAR {e.claim_received.toFixed(0)}</td>
              <td>{e.inspected_by || '—'}</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => { delete_('quality_events', e.id); loadData(); }}
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
