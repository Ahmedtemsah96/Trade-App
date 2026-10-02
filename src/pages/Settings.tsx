import React, { useState, useEffect } from 'react';
import { query, insert, delete_, exportData, importData } from '../db';

interface Organization {
  id: string;
  name: string;
  vat_number?: string;
  base_currency: string;
  usd_rate: number;
}

interface Product {
  id: string;
  name: string;
  sku?: string;
  category?: string;
  origin?: string;
}

export default function Settings() {
  const [org, setOrg] = useState<Organization | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const [showProductForm, setShowProductForm] = useState(false);
  const [orgForm, setOrgForm] = useState({ name: '', vat_number: '', usd_rate: '3.75' });
  const [productForm, setProductForm] = useState({ name: '', sku: '', category: '', origin: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const orgs = await query<Organization>('organizations');
    if (orgs.length === 0) {
      const newOrg: Organization = {
        id: crypto.randomUUID(),
        name: 'My Company',
        base_currency: 'SAR',
        usd_rate: 3.75,
      };
      await insert('organizations', newOrg);
      setOrg(newOrg);
    } else {
      setOrg(orgs[0]);
    }

    const prods = await query<Product>('products');
    setProducts(prods.sort((a, b) => a.name.localeCompare(b.name)));
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: productForm.name,
      sku: productForm.sku,
      category: productForm.category,
      origin: productForm.origin,
    };
    await insert('products', newProduct);
    loadData();
    setProductForm({ name: '', sku: '', category: '', origin: '' });
    setShowProductForm(false);
  };

  const handleExport = async () => {
    const data = await exportData();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    link.download = 'container-ledger-backup.json';
    link.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const data = JSON.parse(event.target?.result as string);
      await importData(data);
      loadData();
      alert('Data imported successfully!');
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h1>Settings</h1>
      <p className="subtitle">Company and VAT details, USD rate, products, bills of lading.</p>

      <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Company</h2>
      {org && (
        <div style={{ background: 'white', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <p><strong>Name:</strong> {org.name}</p>
          <p><strong>VAT:</strong> {org.vat_number || '—'}</p>
          <p><strong>USD Rate:</strong> {org.usd_rate} SAR</p>
        </div>
      )}

      <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Products</h2>
      {!showProductForm ? (
        <button onClick={() => setShowProductForm(true)}>Add product</button>
      ) : (
        <form onSubmit={handleAddProduct} style={{ background: '#f9f9f9', padding: '20px', borderRadius: '8px', marginBottom: '20px' }}>
          <h3>New product</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div className="form-group">
              <label>Name</label>
              <input
                required
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>SKU</label>
              <input
                value={productForm.sku}
                onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <input
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Origin</label>
              <input
                value={productForm.origin}
                onChange={(e) => setProductForm({ ...productForm, origin: e.target.value })}
              />
            </div>
          </div>
          <button type="submit">Save product</button>
          <button type="button" className="secondary" onClick={() => setShowProductForm(false)} style={{ marginLeft: '10px' }}>
            Cancel
          </button>
        </form>
      )}

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>SKU</th>
            <th>Category</th>
            <th>Origin</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => (
            <tr key={p.id}>
              <td>{p.name}</td>
              <td>{p.sku || '—'}</td>
              <td>{p.category || '—'}</td>
              <td>{p.origin || '—'}</td>
              <td>
                <button
                  className="danger"
                  style={{ padding: '4px 8px', fontSize: '12px' }}
                  onClick={() => { delete_('products', p.id); loadData(); }}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: '30px', marginBottom: '20px' }}>Backup & Restore</h2>
      <div style={{ display: 'flex', gap: '10px' }}>
        <button onClick={handleExport}>Download backup</button>
        <label>
          <input
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button component="span" onClick={(e: any) => e.currentTarget.querySelector('input').click()}>
            Restore from backup
          </button>
        </label>
      </div>
    </div>
  );
}
