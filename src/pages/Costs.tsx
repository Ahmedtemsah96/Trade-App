import { useLedger, update, uid, today, type Cost } from '../store';
import { money, label, COST_TYPES } from '../format';
import { AddPanel, Field, Select, DeleteButton, Empty, Header, fdStr, fdNum } from '../components';

export default function Costs() {
  const ledger = useLedger();
  const container = new Map(ledger.containers.map((c) => [c.id, c.container_number]));
  const vendor = new Map(ledger.vendors.map((v) => [v.id, v.name]));
  const rows = [...ledger.costs].sort((a, b) => b.entry_date.localeCompare(a.entry_date));
  const total = rows.reduce((a, r) => a + r.amount * r.fx_rate, 0);

  function create(f: FormData) {
    const amount = fdNum(f, 'amount');
    if (amount === null || !(amount > 0)) return 'Enter an amount greater than zero.';
    const cost: Cost = {
      id: uid(), container_id: String(f.get('container_id')), cost_type: String(f.get('cost_type')),
      amount, currency: String(f.get('currency') || 'SAR'), fx_rate: fdNum(f, 'fx_rate') || 1,
      vendor_id: fdStr(f, 'vendor_id'), document_ref: fdStr(f, 'document_ref'),
      description: fdStr(f, 'description'), entry_date: fdStr(f, 'entry_date') ?? today(),
    };
    update((s) => ({ ...s, costs: [...s.costs, cost] }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Header title="Cost ledger">
        Post against a container and it lands in that container&rsquo;s margin immediately.
        Foreign-currency invoices convert at the rate you enter.
      </Header>

      {ledger.containers.length === 0 ? (
        <Empty title="Register a container first" hint="Costs attach to a container, so there has to be one to attach to." />
      ) : (
        <>
          <AddPanel onSubmit={create} label="Post cost" title="New cost entry">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={ledger.containers.map((c) => [c.id, c.container_number])} />
            <Select name="cost_type" label="Cost type" required options={COST_TYPES} />
            <Field name="amount" label="Amount" type="number" step="0.01" required />
            <Select name="currency" label="Currency" defaultValue="SAR" options={[['SAR', 'SAR'], ['USD', 'USD'], ['EUR', 'EUR']]} />
            <Field name="fx_rate" label="Rate to SAR" type="number" step="0.0001" defaultValue="1" />
            <Select name="vendor_id" label="Paid to" placeholder="Not set" options={ledger.vendors.map((v) => [v.id, v.name])} />
            <Field name="document_ref" label="Document reference" placeholder="CI-0492 / clearance invoice no." />
            <Field name="entry_date" label="Entry date" type="date" defaultValue={today()} />
            <Field name="description" label="Note" placeholder="Optional" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="No costs posted" hint="Start with the supplier invoice, then freight and clearance." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="th">Date</th><th className="th">Container</th><th className="th">Type</th>
                    <th className="th">Paid to</th><th className="th">Reference</th>
                    <th className="th text-right">Amount</th><th className="th text-right">In SAR</th><th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td tnum font-num text-ink-soft">{r.entry_date}</td>
                      <td className="td font-num">{container.get(r.container_id) ?? '—'}</td>
                      <td className="td">{label(COST_TYPES, r.cost_type)}</td>
                      <td className="td text-ink-soft">{(r.vendor_id && vendor.get(r.vendor_id)) || '—'}</td>
                      <td className="td text-micro text-ink-faint">{r.document_ref ?? '—'}</td>
                      <td className="td tnum text-right font-num">{r.currency} {r.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                      <td className="td tnum text-right font-num">{money(r.amount * r.fx_rate)}</td>
                      <td className="td text-right">
                        <DeleteButton confirmText="Remove this cost entry?"
                          onDelete={() => update((s) => ({ ...s, costs: s.costs.filter((x) => x.id !== r.id) }))} />
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
