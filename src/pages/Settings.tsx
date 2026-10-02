import { useRef, useState } from 'react';
import { useLedger, update, uid, getLedger, replaceLedger, emptyLedger, parseLedger } from '../store';
import { AddPanel, Field, Select, DeleteButton, Empty, SeedButton, Header, fdStr, fdNum } from '../components';

export default function Settings() {
  const ledger = useLedger();
  const vendor = new Map(ledger.vendors.map((v) => [v.id, v.name]));
  const [saved, setSaved] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function saveCompany(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    update((s) => ({ ...s, company: {
      name: String(f.get('name')).trim() || 'My company',
      vat_number: String(f.get('vat_number') ?? '').trim(),
      usd_rate: fdNum(f, 'usd_rate') ?? 3.75,
    } }));
    setSaved(true); setTimeout(() => setSaved(false), 2000);
  }

  function createProduct(f: FormData) {
    update((s) => ({ ...s, products: [...s.products, {
      id: uid(), name: String(f.get('name')).trim(), sku: fdStr(f, 'sku'),
      category: fdStr(f, 'category'), origin: fdStr(f, 'origin'),
    }] }));
  }

  function createShipment(f: FormData) {
    const bol = String(f.get('bol_number')).trim().toUpperCase();
    if (ledger.shipments.some((x) => x.bol_number === bol)) return `${bol} is already registered.`;
    update((s) => ({ ...s, shipments: [...s.shipments, {
      id: uid(), bol_number: bol, vendor_id: fdStr(f, 'vendor_id'), vessel_name: fdStr(f, 'vessel_name'),
      origin_port: fdStr(f, 'origin_port'), destination_port: fdStr(f, 'destination_port'), eta_date: fdStr(f, 'eta_date'),
    }] }));
  }

  function download() {
    const blob = new Blob([JSON.stringify(getLedger(), null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `container-ledger-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function restore(file: File | undefined) {
    if (!file) return;
    try {
      const parsed = parseLedger(JSON.parse(await file.text()));
      if (!parsed) throw new Error('not a ledger');
      if (!confirm(`Replace everything in this browser with the backup (${parsed.containers.length} containers)?`)) return;
      replaceLedger(parsed);
      setRestoreMsg({ ok: true, text: `Restored ${parsed.containers.length} containers.` });
    } catch {
      setRestoreMsg({ ok: false, text: 'That file is not a Container Ledger backup. Nothing was changed.' });
    }
    if (fileRef.current) fileRef.current.value = '';
  }

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <Header title="Settings">Company details, products and bills of lading, plus backup and restore.</Header>

      <section>
        <h2 className="mb-4 text-sm font-semibold">Company</h2>
        <form key={ledger.company.name + ledger.company.usd_rate} onSubmit={saveCompany} className="panel grid gap-4 p-5 sm:grid-cols-2">
          <Field name="name" label="Company name" required defaultValue={ledger.company.name} />
          <Field name="vat_number" label="VAT registration number" defaultValue={ledger.company.vat_number} />
          <Field name="usd_rate" label="USD to SAR rate" type="number" step="0.0001" defaultValue={ledger.company.usd_rate} />
          <div className="flex items-end gap-3 sm:col-span-2">
            <button type="submit" className="btn-primary">Save changes</button>
            {saved && <span className="text-sm text-sage">Saved</span>}
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Products</h2>
        <p className="mb-4 text-sm text-ink-soft">What you import, by grade and origin. Containers point at one of these.</p>
        <AddPanel onSubmit={createProduct} label="Add product" title="New product">
          <Field name="name" label="Name" required placeholder="Banana — Filipino 13kg" />
          <Field name="sku" label="Code" placeholder="BAN-PH-13" />
          <Field name="category" label="Category" placeholder="Banana" />
          <Field name="origin" label="Origin" placeholder="Philippines" />
        </AddPanel>
        {ledger.products.length === 0 ? (
          <Empty title="No products" hint="Add the grades you trade so margin can be compared across them." />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead><tr><th className="th">Product</th><th className="th">Code</th><th className="th">Category</th><th className="th">Origin</th><th className="th" /></tr></thead>
              <tbody>
                {[...ledger.products].sort((a, b) => a.name.localeCompare(b.name)).map((p) => (
                  <tr key={p.id}>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td font-num text-ink-soft">{p.sku ?? '—'}</td>
                    <td className="td text-ink-soft">{p.category ?? '—'}</td>
                    <td className="td text-ink-soft">{p.origin ?? '—'}</td>
                    <td className="td text-right">
                      <DeleteButton confirmText={`Remove ${p.name}?`} onDelete={() => update((s) => ({
                        ...s, products: s.products.filter((x) => x.id !== p.id),
                        containers: s.containers.map((c) => (c.product_id === p.id ? { ...c, product_id: null } : c)),
                      }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Bills of lading</h2>
        <p className="mb-4 text-sm text-ink-soft">One BoL usually carries several containers. Register it here, then point containers at it.</p>
        <AddPanel onSubmit={createShipment} label="Add bill of lading" title="New bill of lading">
          <Field name="bol_number" label="BoL number" required placeholder="CMDUSIN0492817" />
          <Select name="vendor_id" label="Supplier" placeholder="Not set" options={ledger.vendors.map((v) => [v.id, v.name])} />
          <Field name="vessel_name" label="Vessel" placeholder="CMA CGM Jules Verne" />
          <Field name="origin_port" label="Load port" placeholder="Davao" />
          <Field name="destination_port" label="Discharge port" placeholder="Dammam" />
          <Field name="eta_date" label="ETA" type="date" />
        </AddPanel>
        {ledger.shipments.length === 0 ? (
          <Empty title="No bills of lading" hint="Optional, but it groups containers that arrived together." />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead><tr><th className="th">BoL</th><th className="th">Supplier</th><th className="th">Vessel</th><th className="th">Route</th><th className="th">ETA</th><th className="th" /></tr></thead>
              <tbody>
                {ledger.shipments.map((x) => (
                  <tr key={x.id}>
                    <td className="td font-num">{x.bol_number}</td>
                    <td className="td text-ink-soft">{(x.vendor_id && vendor.get(x.vendor_id)) || '—'}</td>
                    <td className="td text-ink-soft">{x.vessel_name ?? '—'}</td>
                    <td className="td text-ink-soft">{x.origin_port ?? '—'} → {x.destination_port ?? '—'}</td>
                    <td className="td tnum font-num text-ink-soft">{x.eta_date ?? '—'}</td>
                    <td className="td text-right">
                      <DeleteButton confirmText={`Remove ${x.bol_number}? Containers on it stay, without a BoL.`} onDelete={() => update((s) => ({
                        ...s, shipments: s.shipments.filter((y) => y.id !== x.id),
                        containers: s.containers.map((c) => (c.shipment_id === x.id ? { ...c, shipment_id: null } : c)),
                      }))} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-t border-paper-rule pt-8">
        <h2 className="mb-1 text-sm font-semibold">Backup and restore</h2>
        <p className="mb-4 max-w-2xl text-sm text-ink-soft">
          Your books live in this browser on this device. Clearing the browser&rsquo;s site data erases
          them, so download a backup regularly. Open the backup file on another device to carry on there.
        </p>
        <div className="flex flex-wrap gap-3">
          <button className="btn-primary" onClick={download}>Download backup</button>
          <button className="btn-ghost" onClick={() => fileRef.current?.click()}>Restore from backup…</button>
          <input ref={fileRef} type="file" accept="application/json,.json" className="hidden"
            onChange={(e) => restore(e.target.files?.[0])} />
        </div>
        {restoreMsg && (
          <p className={`mt-3 text-sm ${restoreMsg.ok ? 'text-sage' : 'text-clay'}`}>{restoreMsg.text}</p>
        )}
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Sample data</h2>
        <p className="mb-4 text-sm text-ink-soft">Loads four containers with costs, sales and quality events so you can see how the ledger behaves.</p>
        <div className="flex flex-wrap items-start gap-6">
          <SeedButton />
          <button className="text-sm text-ink-faint underline underline-offset-4 hover:text-clay"
            onClick={() => { if (confirm('Erase ALL data in this browser? Download a backup first if you need it.')) replaceLedger(emptyLedger()); }}>
            Erase everything
          </button>
        </div>
      </section>
    </div>
  );
}
