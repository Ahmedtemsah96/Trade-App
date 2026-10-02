import { useLedger, update, uid, today } from '../store';
import { vendorBalances } from '../ledger';
import { money, label, VENDOR_KINDS } from '../format';
import { AddPanel, Field, Select, DeleteButton, Empty, Stat, Header, fdStr, fdNum } from '../components';

export default function Vendors() {
  const ledger = useLedger();
  const rows = vendorBalances(ledger).sort((a, b) => a.name.localeCompare(b.name));
  const vendor = new Map(ledger.vendors.map((v) => [v.id, v.name]));
  const payments = [...ledger.payments].sort((a, b) => b.payment_date.localeCompare(a.payment_date)).slice(0, 50);

  const payable = rows.reduce((a, r) => a + Math.max(r.balance, 0), 0);
  const invoiced = rows.reduce((a, r) => a + r.total_invoiced, 0);
  const paid = rows.reduce((a, r) => a + r.total_paid, 0);

  function createVendor(f: FormData) {
    update((s) => ({ ...s, vendors: [...s.vendors, {
      id: uid(), name: String(f.get('name')).trim(), kind: String(f.get('kind') || 'supplier'),
      country: fdStr(f, 'country'), contact_person: fdStr(f, 'contact_person'), email: fdStr(f, 'email'),
      phone: fdStr(f, 'phone'), payment_terms_days: fdNum(f, 'payment_terms_days') ?? 30,
      opening_balance: fdNum(f, 'opening_balance') ?? 0,
    }] }));
  }

  function createPayment(f: FormData) {
    const amount = fdNum(f, 'amount');
    if (amount === null || !(amount > 0)) return 'Enter an amount greater than zero.';
    update((s) => ({ ...s, payments: [...s.payments, {
      id: uid(), vendor_id: String(f.get('vendor_id')), amount, currency: 'SAR',
      bank: fdStr(f, 'bank'), reference: fdStr(f, 'reference'), payment_date: fdStr(f, 'payment_date') ?? today(),
    }] }));
  }

  // Cost entries and containers stay but lose the vendor link; its payments go with it.
  const removeVendor = (id: string) => update((s) => ({
    ...s,
    vendors: s.vendors.filter((v) => v.id !== id),
    payments: s.payments.filter((p) => p.vendor_id !== id),
    costs: s.costs.map((c) => (c.vendor_id === id ? { ...c, vendor_id: null } : c)),
    containers: s.containers.map((c) => (c.vendor_id === id ? { ...c, vendor_id: null } : c)),
    shipments: s.shipments.map((x) => (x.vendor_id === id ? { ...x, vendor_id: null } : x)),
  }));

  return (
    <div className="mx-auto max-w-6xl">
      <Header title="Vendors">
        Balance is the opening figure plus everything you posted against them in the cost ledger,
        less what you have paid.
      </Header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-1 gap-6 border-y sm:grid-cols-3 border-paper-rule py-6">
          <Stat label="Outstanding payable" value={money(payable)} tone={payable > 0 ? 'clay' : 'sage'} />
          <Stat label="Invoiced to date" value={money(invoiced)} />
          <Stat label="Settled" value={money(paid)} tone="sage"
            sub={invoiced ? `${((paid / invoiced) * 100).toFixed(1)}% of invoiced` : undefined} />
        </section>
      )}

      <AddPanel onSubmit={createVendor} label="Add vendor" title="New vendor">
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
                <th className="th">Vendor</th><th className="th">Type</th><th className="th">Country</th>
                <th className="th text-right">Terms</th><th className="th text-right">Invoiced</th>
                <th className="th text-right">Paid</th><th className="th text-right">Balance</th><th className="th" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td className="td font-medium">{r.name}</td>
                  <td className="td text-ink-soft">{label(VENDOR_KINDS, r.kind)}</td>
                  <td className="td text-ink-soft">{r.country ?? '—'}</td>
                  <td className="td tnum text-right font-num text-ink-soft">{r.payment_terms_days}d</td>
                  <td className="td tnum text-right font-num">{money(r.total_invoiced)}</td>
                  <td className="td tnum text-right font-num">{money(r.total_paid)}</td>
                  <td className={`td tnum text-right font-num font-medium ${r.balance > 0.005 ? 'text-clay' : r.balance < -0.005 ? 'text-crate' : 'text-sage'}`}>
                    {money(Math.abs(r.balance))}
                    <span className="ml-1 text-micro font-normal text-ink-faint">
                      {r.balance > 0.005 ? 'due' : r.balance < -0.005 ? 'advance' : 'settled'}
                    </span>
                  </td>
                  <td className="td text-right">
                    <DeleteButton onDelete={() => removeVendor(r.id)}
                      confirmText={`Remove ${r.name}? Cost entries stay but lose the vendor link, and its payments are deleted.`} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {ledger.vendors.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-semibold">Payments</h2>
          <AddPanel onSubmit={createPayment} label="Record payment" title="New payment">
            <Select name="vendor_id" label="Vendor" required placeholder="Select vendor" options={ledger.vendors.map((v) => [v.id, v.name])} />
            <Field name="amount" label="Amount (SAR)" type="number" step="0.01" required />
            <Field name="bank" label="Bank" placeholder="Al Rajhi" />
            <Field name="reference" label="Reference" placeholder="TT-88214" />
            <Field name="payment_date" label="Payment date" type="date" defaultValue={today()} />
          </AddPanel>

          {payments.length > 0 && (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[620px]">
                <thead>
                  <tr>
                    <th className="th">Date</th><th className="th">Vendor</th><th className="th">Bank</th>
                    <th className="th">Reference</th><th className="th text-right">Amount</th><th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td className="td tnum font-num text-ink-soft">{p.payment_date}</td>
                      <td className="td">{vendor.get(p.vendor_id) ?? '—'}</td>
                      <td className="td text-ink-soft">{p.bank ?? '—'}</td>
                      <td className="td font-num text-micro text-ink-faint">{p.reference ?? '—'}</td>
                      <td className="td tnum text-right font-num">{money(p.amount)}</td>
                      <td className="td text-right">
                        <DeleteButton confirmText="Remove this payment?"
                          onDelete={() => update((s) => ({ ...s, payments: s.payments.filter((x) => x.id !== p.id) }))} />
                      </td>
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
