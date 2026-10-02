import { useLedger, update, uid, today } from '../store';
import { pnlRows } from '../ledger';
import { money, num, pct, label, QUALITY_TYPES } from '../format';
import { AddPanel, Field, Select, DeleteButton, Empty, Stat, Header, fdStr, fdNum } from '../components';

export default function Quality() {
  const ledger = useLedger();
  const container = new Map(ledger.containers.map((c) => [c.id, c.container_number]));
  const costPerCarton = new Map(pnlRows(ledger).map((p) => [p.id, p.cost_per_carton]));
  const rows = [...ledger.quality].sort((a, b) => b.event_date.localeCompare(a.event_date));

  const affected = rows.reduce((a, r) => a + r.affected_cartons, 0);
  const claims = rows.reduce((a, r) => a + r.claim_received, 0);
  const grossLoss = rows.reduce((a, r) => a + r.affected_cartons * (costPerCarton.get(r.container_id) ?? 0), 0);
  const netLoss = Math.max(grossLoss - claims, 0);
  const recovery = grossLoss > 0 ? (claims / grossLoss) * 100 : 0;

  function create(f: FormData) {
    update((s) => ({ ...s, quality: [...s.quality, {
      id: uid(), container_id: String(f.get('container_id')), event_type: String(f.get('event_type')),
      affected_cartons: fdNum(f, 'affected_cartons') ?? 0, damage_percent: fdNum(f, 'damage_percent') ?? 0,
      claim_received: fdNum(f, 'claim_received') ?? 0, inspected_by: fdStr(f, 'inspected_by'),
      notes: fdStr(f, 'notes'), event_date: fdStr(f, 'event_date') ?? today(),
    }] }));
  }

  return (
    <div className="mx-auto max-w-6xl">
      <Header title="Quality and claims">
        Damage is valued at the container&rsquo;s own cost per carton, then reduced by whatever the
        insurer actually paid.
      </Header>

      {rows.length > 0 && (
        <section className="mb-8 grid grid-cols-2 gap-6 border-y border-paper-rule py-6 lg:grid-cols-4">
          <Stat label="Cartons affected" value={num(affected)} />
          <Stat label="Loss at cost" value={money(grossLoss)} />
          <Stat label="Claims recovered" value={money(claims)} sub={pct(recovery) + ' of loss'} tone="sage" />
          <Stat label="Written off" value={money(netLoss)} tone={netLoss > 0 ? 'clay' : 'ink'} />
        </section>
      )}

      {ledger.containers.length === 0 ? (
        <Empty title="Register a container first" hint="Quality events attach to the container they were found in." />
      ) : (
        <>
          <AddPanel onSubmit={create} label="Log quality event" title="New quality event">
            <Select name="container_id" label="Container" required placeholder="Select container"
              options={ledger.containers.map((c) => [c.id, c.container_number])} />
            <Select name="event_type" label="Type" required options={QUALITY_TYPES} />
            <Field name="affected_cartons" label="Cartons affected" type="number" min="0" required />
            <Field name="damage_percent" label="Damage %" type="number" step="0.01" min="0" />
            <Field name="claim_received" label="Claim received (SAR)" type="number" step="0.01" defaultValue="0" />
            <Field name="inspected_by" label="Inspected by" placeholder="Warehouse QC" />
            <Field name="event_date" label="Date" type="date" defaultValue={today()} />
            <Field name="notes" label="Note" placeholder="What was wrong with it" />
          </AddPanel>

          {rows.length === 0 ? (
            <Empty title="Nothing logged" hint="Record damage as it is found so the margin stays honest." />
          ) : (
            <div className="panel overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr>
                    <th className="th">Date</th><th className="th">Container</th><th className="th">Type</th>
                    <th className="th text-right">Cartons</th><th className="th text-right">Damage</th>
                    <th className="th text-right">Loss at cost</th><th className="th text-right">Recovered</th>
                    <th className="th">Note</th><th className="th" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td className="td tnum font-num text-ink-soft">{r.event_date}</td>
                      <td className="td font-num">{container.get(r.container_id) ?? '—'}</td>
                      <td className="td">{label(QUALITY_TYPES, r.event_type)}</td>
                      <td className="td tnum text-right font-num">{num(r.affected_cartons)}</td>
                      <td className="td tnum text-right font-num">{pct(r.damage_percent)}</td>
                      <td className="td tnum text-right font-num text-clay">{money(r.affected_cartons * (costPerCarton.get(r.container_id) ?? 0))}</td>
                      <td className="td tnum text-right font-num text-sage">{money(r.claim_received)}</td>
                      <td className="td max-w-[16rem] truncate text-micro text-ink-faint">{r.notes ?? '—'}</td>
                      <td className="td text-right">
                        <DeleteButton confirmText="Remove this quality event?"
                          onDelete={() => update((s) => ({ ...s, quality: s.quality.filter((x) => x.id !== r.id) }))} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
