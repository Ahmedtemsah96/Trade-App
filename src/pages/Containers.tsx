import { useLedger, update, uid, today } from '../store';
import { pnlRows } from '../ledger';
import { money, num, label, STAGES } from '../format';
import { AddPanel, Field, Select, DeleteButton, Empty, MarginBar, Header, fdStr, fdNum } from '../components';

export default function Containers() {
  const ledger = useLedger();
  const rows = pnlRows(ledger).sort((a, b) => b.created_at.localeCompare(a.created_at));

  function create(f: FormData) {
    const number = String(f.get('container_number')).trim().toUpperCase();
    if (ledger.containers.some((c) => c.container_number === number)) return `${number} is already registered.`;
    update((s) => ({ ...s, containers: [...s.containers, {
      id: uid(), container_number: number, product_id: fdStr(f, 'product_id'), vendor_id: fdStr(f, 'vendor_id'),
      shipment_id: fdStr(f, 'shipment_id'), origin: fdStr(f, 'origin'), destination_port: fdStr(f, 'destination_port'),
      cartons_received: fdNum(f, 'cartons_received') ?? 0, weight_kg: fdNum(f, 'weight_kg'),
      stage: String(f.get('stage') || 'in_transit'), arrival_date: fdStr(f, 'arrival_date'), created_at: new Date().toISOString(),
    }] }));
  }

  const setStage = (id: string, stage: string) =>
    update((s) => ({ ...s, containers: s.containers.map((c) => (c.id === id ? { ...c, stage } : c)) }));

  // Costs, sales and quality events belong to the container, so they go with it.
  const remove = (id: string) => update((s) => ({
    ...s,
    containers: s.containers.filter((c) => c.id !== id),
    costs: s.costs.filter((x) => x.container_id !== id),
    sales: s.sales.filter((x) => x.container_id !== id),
    quality: s.quality.filter((x) => x.container_id !== id),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <Header title="Containers">
        Each container opens its own cost centre. Everything you post later attaches to one of these.
      </Header>

      <AddPanel onSubmit={create} label="Register container" title="New container">
        <Field name="container_number" label="Container number" required placeholder="SEGU9970606" />
        <Select name="product_id" label="Product" placeholder="Not set" options={ledger.products.map((p) => [p.id, p.name])} />
        <Select name="vendor_id" label="Supplier" placeholder="Not set" options={ledger.vendors.map((v) => [v.id, v.name])} />
        <Select name="shipment_id" label="Bill of lading" placeholder="Not set" options={ledger.shipments.map((s) => [s.id, s.bol_number])} />
        <Field name="origin" label="Origin" placeholder="Philippines" />
        <Field name="destination_port" label="Discharge port" placeholder="Dammam" />
        <Field name="cartons_received" label="Cartons received" type="number" min="0" required />
        <Field name="weight_kg" label="Net weight (kg)" type="number" step="0.01" />
        <Field name="arrival_date" label="Arrival date" type="date" defaultValue={today()} />
        <Select name="stage" label="Stage" defaultValue="in_transit" options={STAGES} />
      </AddPanel>

      {rows.length === 0 ? (
        <Empty title="No containers registered" hint="Register the first one to start collecting costs against it." />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr>
                <th className="th">Container</th><th className="th">Supplier</th><th className="th">Stage</th>
                <th className="th text-right">Cartons</th><th className="th text-right">Landed cost</th>
                <th className="th text-right">Revenue</th><th className="th text-right">Net</th>
                <th className="th">Margin</th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = r.total_revenue > 0 ? (r.net_profit / r.total_revenue) * 100 : 0;
                return (
                  <tr key={r.id}>
                    <td className="td">
                      <span className="font-num">{r.container_number}</span>
                      <span className="block text-micro text-ink-faint">
                        {r.product_name ?? 'No product'}{r.bol_number ? ` · BoL ${r.bol_number}` : ''}
                      </span>
                    </td>
                    <td className="td text-ink-soft">{r.vendor_name ?? '—'}</td>
                    <td className="td">
                      <select aria-label={`Stage of ${r.container_number}`} value={r.stage}
                        onChange={(e) => setStage(r.id, e.target.value)}
                        className="rounded-sm border border-paper-rule bg-white px-2 py-0.5 text-micro text-ink-soft">
                        {STAGES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                      </select>
                    </td>
                    <td className="td tnum text-right font-num">{num(r.cartons_sold)}/{num(r.cartons_received)}</td>
                    <td className="td tnum text-right font-num">{money(r.total_cost)}</td>
                    <td className="td tnum text-right font-num">{money(r.total_revenue)}</td>
                    <td className={`td tnum text-right font-num ${r.net_profit >= 0 ? 'text-sage' : 'text-clay'}`}>{money(r.net_profit)}</td>
                    <td className="td">{r.total_revenue > 0 ? <MarginBar pct={m} /> : <span className="text-micro text-ink-faint">—</span>}</td>
                    <td className="td text-right">
                      <DeleteButton onDelete={() => remove(r.id)}
                        confirmText={`Remove ${r.container_number}? Its costs, sales and quality events go with it.`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
