import { createClient } from '@/lib/supabase/server';
import { createCost, deleteCost } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import { money, label, COST_TYPES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Costs() {
  const supabase = createClient();
  const [{ data: entries }, { data: containers }, { data: vendors }] = await Promise.all([
    supabase
      .from('cost_entries')
      .select('*, containers(container_number), vendors(name)')
      .order('entry_date', { ascending: false })
      .limit(300),
    supabase.from('containers').select('id, container_number').order('container_number'),
    supabase.from('vendors').select('id, name').order('name'),
  ]);

  const rows = entries ?? [];
  const total = rows.reduce((a, r) => a + Number(r.amount) * Number(r.fx_rate), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Cost ledger</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Post against a container and it lands in that container&rsquo;s margin immediately.
          Foreign-currency invoices convert at the rate you enter.
        </p>
      </header>

      {(containers ?? []).length === 0 ? (
        <Empty
          title="Register a container first"
          hint="Costs attach to a container, so there has to be one to attach to."
        />
      ) : (
        <>
          <AddPanel action={createCost} label="Post cost" title="New cost entry">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={(containers ?? []).map((c) => [c.id, c.container_number])} />
            <Select name="cost_type" label="Cost type" required options={COST_TYPES} />
            <Field name="amount" label="Amount" type="number" step="0.01" required />
            <Select name="currency" label="Currency" defaultValue="SAR"
              options={[['SAR', 'SAR'], ['USD', 'USD'], ['EUR', 'EUR']]} />
            <Field name="fx_rate" label="Rate to SAR" type="number" step="0.0001" defaultValue="1" />
            <Select name="vendor_id" label="Paid to" placeholder="Not set"
              options={(vendors ?? []).map((v) => [v.id, v.name])} />
            <Field name="document_ref" label="Document reference" placeholder="CI-0492 / clearance invoice no." />
            <Field name="entry_date" label="Entry date" type="date" />
            <Field name="description" label="Note" placeholder="Optional" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="No costs posted" hint="Start with the supplier invoice, then freight and clearance." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Container</th>
                    <th className="th">Type</th>
                    <th className="th">Paid to</th>
                    <th className="th">Reference</th>
                    <th className="th text-right">Amount</th>
                    <th className="th text-right">In SAR</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td tnum font-num text-ink-soft">{r.entry_date}</td>
                      <td className="td font-num">{(r.containers as any)?.container_number ?? '—'}</td>
                      <td className="td">{label(COST_TYPES, r.cost_type)}</td>
                      <td className="td text-ink-soft">{(r.vendors as any)?.name ?? '—'}</td>
                      <td className="td text-micro text-ink-faint">{r.document_ref ?? '—'}</td>
                      <td className="td tnum text-right font-num">
                        {r.currency} {Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="td tnum text-right font-num">
                        {money(Number(r.amount) * Number(r.fx_rate))}
                      </td>
                      <td className="td text-right">
                        <DeleteButton id={r.id} action={deleteCost} confirmText="Remove this cost entry?" />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="td font-medium" colSpan={6}>Total posted</td>
                    <td className="td tnum text-right font-num font-semibold">{money(total)}</td>
                    <td className="td" />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
