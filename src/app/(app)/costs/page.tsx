import { requireMember } from '@/lib/auth';
import { withOrg } from '@/lib/db';
import { createCost, deleteCost } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import { money, label, COST_TYPES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Costs() {
  const { orgId } = await requireMember();
  const [entries, containers, vendors] = await withOrg(orgId, (db) => Promise.all([
    db.all(`select ce.*, c.container_number, v.name as vendor_name
              from cost_entries ce
              join containers c on c.id = ce.container_id
              left join vendors v on v.id = ce.vendor_id
             order by ce.entry_date desc, ce.created_at desc
             limit 300`),
    db.all('select id, container_number from containers order by container_number'),
    db.all('select id, name from vendors order by name'),
  ]));

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
                      <td className="td font-num">{r.container_number ?? '—'}</td>
                      <td className="td">{label(COST_TYPES, r.cost_type)}</td>
                      <td className="td text-ink-soft">{r.vendor_name ?? '—'}</td>
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
