import { requireMember } from '@/lib/auth';
import { withOrg } from '@/lib/db';
import { createSale, deleteSale } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import Stat from '@/components/Stat';
import { money, num } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Sales() {
  const { orgId } = await requireMember();
  const [sales, containers] = await withOrg(orgId, (db) => Promise.all([
    db.all(`select se.*, c.container_number
              from sales_entries se
              join containers c on c.id = se.container_id
             order by se.sale_date desc, se.created_at desc
             limit 300`),
    db.all('select id, container_number from containers order by container_number'),
  ]));

  const rows = sales ?? [];
  const revenue = rows.reduce((a, r) => a + Number(r.amount), 0);
  const cartons = rows.reduce((a, r) => a + Number(r.cartons_sold), 0);
  const vat = rows.reduce((a, r) => a + Number(r.vat_amount), 0);

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Sales</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Record what left the warehouse and at what price. Revenue posts straight to the
          container it came out of.
        </p>
      </header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-3 gap-6 border-y border-paper-rule py-6">
          <Stat label="Revenue booked" value={money(revenue)} />
          <Stat label="Cartons sold" value={num(cartons)}
            sub={cartons ? `${money(revenue / cartons)} average` : undefined} />
          <Stat label="Output VAT" value={money(vat)} />
        </section>
      )}

      {(containers ?? []).length === 0 ? (
        <Empty title="Register a container first"
          hint="A sale has to come out of a container so the margin can be worked out." />
      ) : (
        <>
          <AddPanel action={createSale} label="Record sale" title="New sale">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={(containers ?? []).map((c) => [c.id, c.container_number])} />
            <Field name="cartons_sold" label="Cartons sold" type="number" min="1" required />
            <Field name="unit_price" label="Price per carton (SAR)" type="number" step="0.01" required />
            <Field name="customer_name" label="Customer" placeholder="Riyadh Central Market" />
            <Field name="invoice_number" label="Invoice number" placeholder="INV-2026-0141" />
            <Field name="vat_amount" label="Output VAT (SAR)" type="number" step="0.01" defaultValue="0" />
            <Field name="sale_date" label="Sale date" type="date" />
            <Field name="notes" label="Note" placeholder="Optional" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="No sales recorded" hint="Margin stays blank until the first sale is posted." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Container</th>
                    <th className="th">Customer</th>
                    <th className="th">Invoice</th>
                    <th className="th text-right">Cartons</th>
                    <th className="th text-right">Unit price</th>
                    <th className="th text-right">Revenue</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td tnum font-num text-ink-soft">{r.sale_date}</td>
                      <td className="td font-num">{r.container_number ?? '—'}</td>
                      <td className="td">{r.customer_name ?? '—'}</td>
                      <td className="td font-num text-micro text-ink-faint">{r.invoice_number ?? '—'}</td>
                      <td className="td tnum text-right font-num">{num(r.cartons_sold)}</td>
                      <td className="td tnum text-right font-num">{money(r.unit_price)}</td>
                      <td className="td tnum text-right font-num font-medium">{money(r.amount)}</td>
                      <td className="td text-right">
                        <DeleteButton id={r.id} action={deleteSale} confirmText="Remove this sale?" />
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
