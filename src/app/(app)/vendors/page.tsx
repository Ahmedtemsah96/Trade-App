import { requireMember } from '@/lib/auth';
import { withOrg } from '@/lib/db';
import { createVendor, deleteVendor, createPayment } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import Stat from '@/components/Stat';
import { money, label, VENDOR_KINDS } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Vendors() {
  const { orgId } = await requireMember();
  const [balances, vendorList, payments] = await withOrg(orgId, (db) => Promise.all([
    db.all('select * from vendor_balances order by name'),
    db.all('select id, name from vendors order by name'),
    db.all(`select vp.*, v.name as vendor_name
              from vendor_payments vp
              join vendors v on v.id = vp.vendor_id
             order by vp.payment_date desc, vp.created_at desc
             limit 50`),
  ]));

  const rows = balances ?? [];
  const payable = rows.reduce((a, r) => a + Math.max(Number(r.balance), 0), 0);
  const invoiced = rows.reduce((a, r) => a + Number(r.total_invoiced), 0);
  const paid = rows.reduce((a, r) => a + Number(r.total_paid), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Vendors</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Balance is the opening figure plus everything you posted against them in the cost ledger,
          less what you have paid.
        </p>
      </header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-3 gap-6 border-y border-paper-rule py-6">
          <Stat label="Outstanding payable" value={money(payable)} tone={payable > 0 ? 'clay' : 'sage'} />
          <Stat label="Invoiced to date" value={money(invoiced)} />
          <Stat label="Settled" value={money(paid)}
            sub={invoiced ? `${((paid / invoiced) * 100).toFixed(1)}% of invoiced` : undefined} tone="sage" />
        </section>
      )}

      <AddPanel action={createVendor} label="Add vendor" title="New vendor">
        <Field name="name" label="Vendor name" required placeholder="Bakrawy Produce" />
        <Select name="kind" label="Type" defaultValue="supplier" options={VENDOR_KINDS} />
        <Field name="country" label="Country" placeholder="Philippines" />
        <Field name="contact_person" label="Contact" placeholder="Name" />
        <Field name="email" label="Email" type="email" />
        <Field name="phone" label="Phone" />
        <Field name="payment_terms_days" label="Terms (days)" type="number" defaultValue="30" />
        <Field name="opening_balance" label="Opening balance (SAR)" type="number" step="0.01" defaultValue="0" />
      </AddPanel>

      {rows.length === 0 ? (
        <Empty title="No vendors yet" hint="Add your suppliers, shipping lines and clearance agents." />
      ) : (
        <div className="panel mb-10 overflow-x-auto">
          <table className="w-full min-w-[760px]">
            <thead>
              <tr>
                <th className="th">Vendor</th>
                <th className="th">Type</th>
                <th className="th">Country</th>
                <th className="th text-right">Terms</th>
                <th className="th text-right">Invoiced</th>
                <th className="th text-right">Paid</th>
                <th className="th text-right">Balance</th>
                <th className="th" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const bal = Number(r.balance);
                return (
                  <tr key={r.id}>
                    <td className="td font-medium">{r.name}</td>
                    <td className="td text-ink-soft">{label(VENDOR_KINDS, r.kind)}</td>
                    <td className="td text-ink-soft">{r.country ?? '—'}</td>
                    <td className="td tnum text-right font-num text-ink-soft">{r.payment_terms_days}d</td>
                    <td className="td tnum text-right font-num">{money(r.total_invoiced)}</td>
                    <td className="td tnum text-right font-num">{money(r.total_paid)}</td>
                    <td className={`td tnum text-right font-num font-medium ${
                      bal > 0 ? 'text-clay' : bal < 0 ? 'text-crate' : 'text-sage'}`}>
                      {money(Math.abs(bal))}
                      <span className="ml-1 text-micro font-normal text-ink-faint">
                        {bal > 0 ? 'due' : bal < 0 ? 'advance' : 'settled'}
                      </span>
                    </td>
                    <td className="td text-right">
                      <DeleteButton id={r.id} action={deleteVendor}
                        confirmText={`Remove ${r.name}? Cost entries stay but lose the vendor link.`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {(vendorList ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Payments</h2>
          <AddPanel action={createPayment} label="Record payment" title="New payment">
            <Select name="vendor_id" label="Vendor" required placeholder="Select vendor"
              options={(vendorList ?? []).map((v) => [v.id, v.name])} />
            <Field name="amount" label="Amount (SAR)" type="number" step="0.01" required />
            <Field name="bank" label="Bank" placeholder="Al Rajhi" />
            <Field name="reference" label="Reference" placeholder="TT-88214" />
            <Field name="payment_date" label="Payment date" type="date" />
          </AddPanel>

          {(payments ?? []).length > 0 && (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[560px]">
                <thead>
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Vendor</th>
                    <th className="th">Bank</th>
                    <th className="th">Reference</th>
                    <th className="th text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(payments ?? []).map((p) => (
                    <tr key={p.id}>
                      <td className="td tnum font-num text-ink-soft">{p.payment_date}</td>
                      <td className="td">{p.vendor_name ?? '—'}</td>
                      <td className="td text-ink-soft">{p.bank ?? '—'}</td>
                      <td className="td font-num text-micro text-ink-faint">{p.reference ?? '—'}</td>
                      <td className="td tnum text-right font-num">{money(p.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
