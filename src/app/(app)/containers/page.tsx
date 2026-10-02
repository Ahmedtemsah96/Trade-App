import { createClient } from '@/lib/supabase/server';
import { createContainer, deleteContainer } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import MarginBar from '@/components/MarginBar';
import { money, num, label, STAGES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Containers() {
  const supabase = createClient();
  const [{ data: rows }, { data: products }, { data: vendors }, { data: shipments }] =
    await Promise.all([
      supabase.from('container_pnl').select('*').order('created_at', { ascending: false }),
      supabase.from('products').select('id, name').order('name'),
      supabase.from('vendors').select('id, name').order('name'),
      supabase.from('shipments').select('id, bol_number').order('created_at', { ascending: false }),
    ]);

  const list = rows ?? [];

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Containers</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Each container opens its own cost centre. Everything you post later attaches to one of these.
        </p>
      </header>

      <AddPanel action={createContainer} label="Register container" title="New container">
        <Field name="container_number" label="Container number" required placeholder="SEGU9970606" />
        <Select name="product_id" label="Product" placeholder="Not set"
          options={(products ?? []).map((p) => [p.id, p.name])} />
        <Select name="vendor_id" label="Supplier" placeholder="Not set"
          options={(vendors ?? []).map((v) => [v.id, v.name])} />
        <Select name="shipment_id" label="Bill of lading" placeholder="Not set"
          options={(shipments ?? []).map((s) => [s.id, s.bol_number])} />
        <Field name="origin" label="Origin" placeholder="Philippines" />
        <Field name="destination_port" label="Discharge port" placeholder="Dammam" />
        <Field name="cartons_received" label="Cartons received" type="number" min="0" required />
        <Field name="weight_kg" label="Net weight (kg)" type="number" step="0.01" />
        <Field name="arrival_date" label="Arrival date" type="date" />
        <Select name="stage" label="Stage" defaultValue="in_transit" options={STAGES} />
      </AddPanel>

      {list.length === 0 ? (
        <Empty
          title="No containers registered"
          hint="Register the first one to start collecting costs against it."
        />
      ) : (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[860px]">
            <thead>
              <tr>
                <th className="th">Container</th>
                <th className="th">Supplier</th>
                <th className="th">Stage</th>
                <th className="th text-right">Cartons</th>
                <th className="th text-right">Landed cost</th>
                <th className="th text-right">Revenue</th>
                <th className="th text-right">Net</th>
                <th className="th">Margin</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {list.map((r) => {
                const m = Number(r.total_revenue) > 0
                  ? (Number(r.net_profit) / Number(r.total_revenue)) * 100 : 0;
                return (
                  <tr key={r.id}>
                    <td className="td">
                      <span className="font-num">{r.container_number}</span>
                      <span className="block text-micro text-ink-faint">
                        {r.product_name ?? 'No product'}
                        {r.bol_number ? ` · BoL ${r.bol_number}` : ''}
                      </span>
                    </td>
                    <td className="td text-ink-soft">{r.vendor_name ?? '—'}</td>
                    <td className="td">
                      <span className="border border-paper-rule px-2 py-0.5 text-micro text-ink-soft">
                        {label(STAGES, r.stage)}
                      </span>
                    </td>
                    <td className="td tnum text-right font-num">
                      {num(r.cartons_sold)}/{num(r.cartons_received)}
                    </td>
                    <td className="td tnum text-right font-num">{money(r.total_cost)}</td>
                    <td className="td tnum text-right font-num">{money(r.total_revenue)}</td>
                    <td className={`td tnum text-right font-num ${
                      Number(r.net_profit) >= 0 ? 'text-sage' : 'text-clay'}`}>
                      {money(r.net_profit)}
                    </td>
                    <td className="td">
                      {Number(r.total_revenue) > 0 ? <MarginBar pct={m} />
                        : <span className="text-micro text-ink-faint">—</span>}
                    </td>
                    <td className="td text-right">
                      <DeleteButton
                        id={r.id}
                        action={deleteContainer}
                        confirmText={`Remove ${r.container_number}? Its costs, sales and quality events go with it.`}
                      />
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
