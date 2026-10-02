import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { money, compact, num, label, COST_TYPES, STAGES } from '@/lib/format';
import Stat from '@/components/Stat';
import MarginBar from '@/components/MarginBar';
import SeedButton from '@/components/SeedButton';

export const dynamic = 'force-dynamic';

export default async function Overview() {
  const supabase = createClient();

  const [{ data: pnl }, { data: costs }] = await Promise.all([
    supabase.from('container_pnl').select('*').order('arrival_date', { ascending: false, nullsFirst: false }),
    supabase.from('cost_entries').select('cost_type, amount, fx_rate'),
  ]);

  const rows = pnl ?? [];
  const totalCost = rows.reduce((a, r) => a + Number(r.total_cost), 0);
  const totalRevenue = rows.reduce((a, r) => a + Number(r.total_revenue), 0);
  const totalProfit = rows.reduce((a, r) => a + Number(r.net_profit), 0);
  const totalLoss = rows.reduce((a, r) => a + Number(r.damage_loss), 0);
  const cartons = rows.reduce((a, r) => a + Number(r.cartons_received), 0);
  const sold = rows.reduce((a, r) => a + Number(r.cartons_sold), 0);
  const margin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;
  const open = rows.filter((r) => r.stage !== 'closed').length;

  // Cost mix — where the money actually goes
  const mix = new Map<string, number>();
  (costs ?? []).forEach((c) => {
    mix.set(c.cost_type, (mix.get(c.cost_type) ?? 0) + Number(c.amount) * Number(c.fx_rate));
  });
  const mixRows = [...mix.entries()].sort((a, b) => b[1] - a[1]);
  const mixTotal = mixRows.reduce((a, [, v]) => a + v, 0) || 1;

  if (rows.length === 0) {
    return (
      <div className="mx-auto max-w-2xl py-16">
        <h1 className="text-2xl font-semibold">Your books are empty</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Register a container to open its cost centre, then post goods, freight, clearance and
          fermentation against it. Margin appears here as soon as a sale is recorded.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/containers" className="btn-primary">Register a container</Link>
          <SeedButton />
        </div>
        <p className="mt-4 text-micro text-ink-faint">
          Sample data loads four containers with costs, sales and quality events so you can see how
          the ledger behaves. You can delete it row by row afterwards.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold">Overview</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {rows.length} containers · {open} still open · {num(sold)} of {num(cartons)} cartons sold
        </p>
      </header>

      <section className="grid grid-cols-2 gap-6 border-y border-paper-rule py-6 lg:grid-cols-4">
        <Stat label="Landed cost" value={`SAR ${compact(totalCost)}`}
          sub={cartons ? `${money(totalCost / cartons)} per carton` : undefined} />
        <Stat label="Revenue booked" value={`SAR ${compact(totalRevenue)}`}
          sub={sold ? `${money(totalRevenue / sold)} per carton sold` : undefined} />
        <Stat label="Net margin" value={`SAR ${compact(totalProfit)}`}
          sub={`${margin.toFixed(1)}% of revenue`} tone={totalProfit >= 0 ? 'sage' : 'clay'} />
        <Stat label="Damage written off" value={`SAR ${compact(totalLoss)}`}
          sub="after insurer claims" tone={totalLoss > 0 ? 'clay' : 'ink'} />
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1.6fr_1fr]">
        {/* Container ledger */}
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-sm font-semibold">Container margin</h2>
            <Link href="/containers" className="text-micro text-ink-faint underline underline-offset-2">
              All containers
            </Link>
          </div>
          <div className="panel overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="th">Container</th>
                  <th className="th">Stage</th>
                  <th className="th text-right">Cost / carton</th>
                  <th className="th text-right">Net</th>
                  <th className="th">Margin</th>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 10).map((r) => {
                  const m = Number(r.total_revenue) > 0
                    ? (Number(r.net_profit) / Number(r.total_revenue)) * 100 : 0;
                  return (
                    <tr key={r.id}>
                      <td className="td">
                        <span className="font-num">{r.container_number}</span>
                        <span className="block text-micro text-ink-faint">
                          {r.product_name ?? 'No product'} · {r.origin ?? '—'}
                        </span>
                      </td>
                      <td className="td text-ink-soft">{label(STAGES, r.stage)}</td>
                      <td className="td tnum text-right font-num">
                        {r.cost_per_carton ? money(r.cost_per_carton) : '—'}
                      </td>
                      <td className={`td tnum text-right font-num ${
                        Number(r.net_profit) >= 0 ? 'text-sage' : 'text-clay'}`}>
                        {money(r.net_profit)}
                      </td>
                      <td className="td">
                        {Number(r.total_revenue) > 0 ? <MarginBar pct={m} />
                          : <span className="text-micro text-ink-faint">No sales yet</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* Cost mix */}
        <section>
          <h2 className="mb-3 text-sm font-semibold">Where the cost sits</h2>
          <div className="panel divide-y divide-paper-rule/60">
            {mixRows.map(([type, amount]) => {
              const share = (amount / mixTotal) * 100;
              return (
                <div key={type} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm">{label(COST_TYPES, type)}</span>
                    <span className="tnum font-num text-sm">{money(amount)}</span>
                  </div>
                  <div className="mt-2 h-1 bg-paper-rule/50">
                    <div className="h-full bg-crate" style={{ width: `${share}%` }} />
                  </div>
                  <span className="tnum mt-1 block text-micro text-ink-faint">
                    {share.toFixed(1)}% of landed cost
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
