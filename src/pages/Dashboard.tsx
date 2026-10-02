import React, { useState, useEffect } from 'react';
import { query } from '../db';

interface Container {
  id: string;
  container_number: string;
  cartons_received: number;
  cartons_sold: number;
  cost_per_carton: number;
  total_cost: number;
  total_revenue: number;
  net_profit: number;
  damage_loss: number;
}

export default function Dashboard() {
  const [containers, setContainers] = useState<Container[]>([]);

  useEffect(() => {
    loadContainers();
  }, []);

  const loadContainers = async () => {
    const data = await query<Container>('containers');
    setContainers(data);
  };

  const totalCost = containers.reduce((a, c) => a + (c.total_cost || 0), 0);
  const totalRevenue = containers.reduce((a, c) => a + (c.total_revenue || 0), 0);
  const totalProfit = containers.reduce((a, c) => a + (c.net_profit || 0), 0);
  const totalLoss = containers.reduce((a, c) => a + (c.damage_loss || 0), 0);
  const cartons = containers.reduce((a, c) => a + (c.cartons_received || 0), 0);
  const sold = containers.reduce((a, c) => a + (c.cartons_sold || 0), 0);

  return (
    <div>
      <h1>Overview</h1>
      <p className="subtitle">{containers.length} containers · {sold.toLocaleString()} of {cartons.toLocaleString()} cartons sold</p>

      <div className="stats">
        <div className="stat">
          <div className="stat-label">Landed cost</div>
          <div className="stat-value">SAR {(totalCost / 1000).toFixed(1)}K</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            SAR {(totalCost / cartons).toFixed(2)} per carton
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Revenue booked</div>
          <div className="stat-value">SAR {(totalRevenue / 1000).toFixed(1)}K</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            SAR {(totalRevenue / sold).toFixed(2)} per carton sold
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Net margin</div>
          <div className="stat-value" style={{ color: totalProfit >= 0 ? '#22c55e' : '#ef4444' }}>
            SAR {(totalProfit / 1000).toFixed(1)}K
          </div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
            {((totalProfit / totalRevenue) * 100).toFixed(1)}% of revenue
          </div>
        </div>
        <div className="stat">
          <div className="stat-label">Damage written off</div>
          <div className="stat-value">SAR {(totalLoss / 1000).toFixed(1)}K</div>
          <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>after insurer claims</div>
        </div>
      </div>

      <h2 style={{ marginTop: '40px', marginBottom: '20px' }}>Container margins</h2>
      <table>
        <thead>
          <tr>
            <th>Container</th>
            <th>Stage</th>
            <th>Cost / carton</th>
            <th>Net margin</th>
          </tr>
        </thead>
        <tbody>
          {containers.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.container_number}</strong></td>
              <td>Closed</td>
              <td>SAR {(c.cost_per_carton || 0).toFixed(2)}</td>
              <td style={{ color: (c.net_profit || 0) >= 0 ? '#22c55e' : '#ef4444' }}>
                SAR {(c.net_profit || 0).toFixed(0)} ({((c.net_profit || 0) / (c.total_cost || 1) * 100).toFixed(1)}%)
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
