import { requireMember } from '@/lib/auth';
import { withOrg } from '@/lib/db';
import {
  updateOrganization, createProduct, deleteProduct, createShipment,
} from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton, Submit } from '@/components/Form';
import Empty from '@/components/Empty';
import SeedButton from '@/components/SeedButton';

export const dynamic = 'force-dynamic';

export default async function Settings() {
  const member = await requireMember();

  const [org, products, shipments, vendors] = await withOrg(member.orgId, (db) => Promise.all([
    db.one('select * from organizations where id = $1', [member.orgId]),
    db.all('select * from products order by name'),
    db.all(`select s.*, v.name as vendor_name
              from shipments s
              left join vendors v on v.id = s.vendor_id
             order by s.created_at desc`),
    db.all('select id, name from vendors order by name'),
  ]));

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <header>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Signed in as {member.fullName ?? member.email} · {member.role}
        </p>
      </header>

      <section>
        <h2 className="mb-4 text-sm font-semibold">Company</h2>
        <form action={async (fd: FormData) => { 'use server'; await updateOrganization({}, fd); }}
          className="panel grid gap-4 p-5 sm:grid-cols-2">
          <Field name="name" label="Company name" required defaultValue={org?.name} />
          <Field name="vat_number" label="VAT registration number" defaultValue={org?.vat_number ?? ''} />
          <Field name="usd_rate" label="USD to SAR rate" type="number" step="0.0001"
            defaultValue={org?.usd_rate ?? 3.75} />
          <div className="flex items-end sm:col-span-2">
            <Submit>Save changes</Submit>
          </div>
        </form>
      </section>

      <section>
        <h2 className="mb-1 text-sm font-semibold">Products</h2>
        <p className="mb-4 text-sm text-ink-soft">
          What you import, by grade and origin. Containers point at one of these.
        </p>
        <AddPanel action={createProduct} label="Add product" title="New product">
          <Field name="name" label="Name" required placeholder="Banana — Filipino 13kg" />
          <Field name="sku" label="Code" placeholder="BAN-PH-13" />
          <Field name="category" label="Category" placeholder="Banana" />
          <Field name="origin" label="Origin" placeholder="Philippines" />
        </AddPanel>

        {(products ?? []).length === 0 ? (
          <Empty title="No products" hint="Add the grades you trade so margin can be compared across them." />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[520px]">
              <thead>
                <tr>
                  <th className="th">Product</th>
                  <th className="th">Code</th>
                  <th className="th">Category</th>
                  <th className="th">Origin</th>
                  <th className="th" />
                </tr>
              </thead>
              <tbody>
                {(products ?? []).map((p) => (
                  <tr key={p.id}>
                    <td className="td font-medium">{p.name}</td>
                    <td className="td font-num text-ink-soft">{p.sku ?? '—'}</td>
                    <td className="td text-ink-soft">{p.category ?? '—'}</td>
                    <td className="td text-ink-soft">{p.origin ?? '—'}</td>
                    <td className="td text-right">
                      <DeleteButton id={p.id} action={deleteProduct} confirmText={`Remove ${p.name}?`} />
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
        <p className="mb-4 text-sm text-ink-soft">
          One BoL usually carries several containers. Register it here, then point containers at it.
        </p>
        <AddPanel action={createShipment} label="Add bill of lading" title="New bill of lading">
          <Field name="bol_number" label="BoL number" required placeholder="CMDUSIN0492817" />
          <Select name="vendor_id" label="Supplier" placeholder="Not set"
            options={(vendors ?? []).map((v) => [v.id, v.name])} />
          <Field name="vessel_name" label="Vessel" placeholder="CMA CGM Jules Verne" />
          <Field name="origin_port" label="Load port" placeholder="Davao" />
          <Field name="destination_port" label="Discharge port" placeholder="Dammam" />
          <Field name="eta_date" label="ETA" type="date" />
        </AddPanel>

        {(shipments ?? []).length === 0 ? (
          <Empty title="No bills of lading" hint="Optional, but it groups containers that arrived together." />
        ) : (
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr>
                  <th className="th">BoL</th>
                  <th className="th">Supplier</th>
                  <th className="th">Vessel</th>
                  <th className="th">Route</th>
                  <th className="th">ETA</th>
                </tr>
              </thead>
              <tbody>
                {(shipments ?? []).map((s) => (
                  <tr key={s.id}>
                    <td className="td font-num">{s.bol_number}</td>
                    <td className="td text-ink-soft">{s.vendor_name ?? '—'}</td>
                    <td className="td text-ink-soft">{s.vessel_name ?? '—'}</td>
                    <td className="td text-ink-soft">{s.origin_port ?? '—'} → {s.destination_port ?? '—'}</td>
                    <td className="td tnum font-num text-ink-soft">{s.eta_date ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="border-t border-paper-rule pt-8">
        <h2 className="mb-1 text-sm font-semibold">Sample data</h2>
        <p className="mb-4 text-sm text-ink-soft">
          Loads four containers with costs, sales and quality events into this workspace so you can
          see how the ledger behaves. Safe to run on an empty workspace only.
        </p>
        <SeedButton />
      </section>
    </div>
  );
}
