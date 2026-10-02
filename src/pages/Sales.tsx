import { useLedger, update, uid, today } from '../store';
import { money, num } from '../format';
import { AddPanel, Field, Select, DeleteButton, Empty, Stat, Header, fdStr, fdNum } from '../components';

export default function Sales() {
  const ledger = useLedger();
  const container = new Map(ledger.containers.map((c) => [c.id, c.container_number]));
  const rows = [...ledger.sales].sort((a, b) => b.sale_date.localeCompare(a.sale_date));
  const revenue = rows.reduce((a, r) => a + r.amount, 0);
  const cartons = rows.reduce((a, r) => a + r.cartons_sold, 0);
  const vat = rows.reduce((a, r) => a + r.vat_amount, 0);

  function create(f: FormData) {
    const cartonsSold = fdNum(f, 'cartons_sold') ?? 0;
    const price = fdNum(f, 'unit_price') ?? 0;
    if (!(cartonsSold > 0)) return 'Enter the number of cartons sold.';
    update((s) => ({ ...s, sales: [...s.sales, {
      id: uid(), container_id: String(f.get('container_id')), cartons_sold: cartonsSold, unit_price: price,
      amount: Math.round(cartonsSold * price * 100) / 100, customer_name: fdStr(f, 'customer_name'),
      invoice_number: fdStr(f, 'invoice_number'), vat_amount: fdNum(f, 'vat_amount') ?? 0,
      sale_date: fdStr(f, 'sale_date') ?? today(), notes: fdStr(f, 'notes'),
    }] }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Header title="Sales">
        Record what left the warehouse and at what price. Revenue posts straight to the container it came out of.
      </Header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-1 gap-6 border-y sm:grid-cols-3 border-paper-rule py-6">
          <Stat label="Revenue booked" value={money(revenue)} />
          <Stat label="Cartons sold" value={num(cartons)} sub={cartons ? `${money(revenue / cartons)} average` : undefined} />
          <Stat label="Output VAT" value={money(vat)} />
        </section>
      )}

      {ledger.containers.length === 0 ? (
        <Empty title="Register a container first" hint="A sale has to come out of a container so the margin can be worked out." />
      ) : (
        <>
          <AddPanel onSubmit={create} label="Record sale" title="New sale">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={ledger.containers.map((c) => [c.id, c.container_number])} />
            <Field name="cartons_sold" label="Cartons sold" type="number" min="1" required />
            <Field name="unit_price" label="Price per carton (SAR)" type="number" step="0.01" required />
            <Field name="customer_name" label="Customer" placeholder="Riyadh Central Market" />
            <Field name="invoice_number" label="Invoice number" placeholder="INV-2026-0141" />
            <Field name="vat_amount" label="Output VAT (SAR)" type="number" step="0.01" defaultValue="0" />
            <Field name="sale_date" label="Sale date" type="date" defaultValue={today()} />
            <Field name="notes" label="Note" placeholder="Optional" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="No sales recorded" hint="Margin stays blank until the first sale is posted." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="th">Date</th><th className="th">Container</th><th className="th">Customer</th>
                    <th className="th">Invoice</th><th className="th text-right">Cartons</th>
                    <th className="th text-right">Unit price</th><th className="th text-right">Revenue</th><th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td tnum font-num text-ink-soft">{r.sale_date}</td>
                      <td className="td font-num">{container.get(r.container_id) ?? '—'}</td>
                      <td className="td">{r.customer_name ?? '—'}</td>
                      <td className="td font-num text-micro text-ink-faint">{r.invoice_number ?? '—'}</td>
                      <td className="td tnum text-right font-num">{num(r.cartons_sold)}</td>
                      <td className="td tnum text-right font-num">{money(r.unit_price)}</td>
                      <td className="td tnum text-right font-num font-medium">{money(r.amount)}</td>
                      <td className="td text-right">
                        <DeleteButton confirmText="Remove this sale?"
                          onDelete={() => update((s) => ({ ...s, sales: s.sales.filter((x) => x.id !== r.id) }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="td font-medium" colSpan={4}>Total</td>
                    <td className="td tnum text-right font-num font-semibold">{num(cartons)}</td>
                    <td className="td" />
                    <td className="td tnum text-right font-num font-semibold">{money(revenue)}</td>
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
