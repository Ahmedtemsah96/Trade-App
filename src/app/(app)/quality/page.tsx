import { requireMember } from '@/lib/auth';
import { withOrg } from '@/lib/db';
import { createQuality, deleteQuality } from '@/app/actions';
import { AddPanel, Field, Select, DeleteButton } from '@/components/Form';
import Empty from '@/components/Empty';
import Stat from '@/components/Stat';
import { money, num, pct, label, QUALITY_TYPES } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Quality() {
  const { orgId } = await requireMember();
  const [events, containers, pnl] = await withOrg(orgId, (db) => Promise.all([
    db.all(`select qe.*, c.container_number
              from quality_events qe
              join containers c on c.id = qe.container_id
             order by qe.event_date desc, qe.created_at desc
             limit 200`),
    db.all('select id, container_number from containers order by container_number'),
    db.all('select id, container_number, cost_per_carton from container_pnl'),
  ]));

  const rows = events ?? [];
  const costPerCarton = new Map((pnl ?? []).map((p) => [p.id, Number(p.cost_per_carton ?? 0)]));

  const affected = rows.reduce((a, r) => a + Number(r.affected_cartons), 0);
  const claims = rows.reduce((a, r) => a + Number(r.claim_received), 0);
  const grossLoss = rows.reduce(
    (a, r) => a + Number(r.affected_cartons) * (costPerCarton.get(r.container_id) ?? 0), 0);
  const netLoss = Math.max(grossLoss - claims, 0);
  const recovery = grossLoss > 0 ? (claims / grossLoss) * 100 : 0;

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Quality and claims</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Damage is valued at the container&rsquo;s own cost per carton, then reduced by whatever the
          insurer actually paid.
        </p>
      </header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-2 gap-6 border-y border-paper-rule py-6 lg:grid-cols-4">
          <Stat label="Cartons affected" value={num(affected)} />
          <Stat label="Loss at cost" value={money(grossLoss)} />
          <Stat label="Claims recovered" value={money(claims)} sub={pct(recovery) + ' of loss'} tone="sage" />
          <Stat label="Written off" value={money(netLoss)} tone={netLoss > 0 ? 'clay' : 'ink'} />
        </section>
      )}

      {(containers ?? []).length === 0 ? (
        <Empty title="Register a container first"
          hint="Quality events attach to the container they were found in." />
      ) : (
        <>
          <AddPanel action={createQuality} label="Log quality event" title="New quality event">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={(containers ?? []).map((c) => [c.id, c.container_number])} />
            <Select name="event_type" label="Type" required options={QUALITY_TYPES} />
            <Field name="affected_cartons" label="Cartons affected" type="number" min="0" required />
            <Field name="damage_percent" label="Damage %" type="number" step="0.01" min="0" />
            <Field name="claim_received" label="Claim received (SAR)" type="number" step="0.01" defaultValue="0" />
            <Field name="inspected_by" label="Inspected by" placeholder="Warehouse QC" />
            <Field name="event_date" label="Date" type="date" />
            <Field name="notes" label="Note" placeholder="What was wrong with it" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="Nothing logged" hint="Record damage as it is found so the margin stays honest." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr>
                    <th className="th">Date</th>
                    <th className="th">Container</th>
                    <th className="th">Type</th>
                    <th className="th text-right">Cartons</th>
                    <th className="th text-right">Damage</th>
                    <th className="th text-right">Loss at cost</th>
                    <th className="th text-right">Recovered</th>
                    <th className="th">Note</th>
                    <th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => {
                    const loss = Number(r.affected_cartons) * (costPerCarton.get(r.container_id) ?? 0);
                    return (
                      <tr key={r.id}>
                        <td className="td tnum font-num text-ink-soft">{r.event_date}</td>
                        <td className="td font-num">{r.container_number ?? '—'}</td>
                        <td className="td">{label(QUALITY_TYPES, r.event_type)}</td>
                        <td className="td tnum text-right font-num">{num(r.affected_cartons)}</td>
                        <td className="td tnum text-right font-num">{pct(r.damage_percent)}</td>
                        <td className="td tnum text-right font-num text-clay">{money(loss)}</td>
                        <td className="td tnum text-right font-num text-sage">{money(r.claim_received)}</td>
                        <td className="td max-w-[16rem] truncate text-micro text-ink-faint">{r.notes ?? '—'}</td>
                        <td className="td text-right">
                          <DeleteButton id={r.id} action={deleteQuality} confirmText="Remove this quality event?" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
