import type { Ledger } from './store';

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/** Per-container P&L. Same arithmetic the original database view used. */
export function pnlRows(s: Ledger) {
  const product = new Map(s.products.map((p) => [p.id, p.name]));
  const vendor = new Map(s.vendors.map((v) => [v.id, v.name]));
  const bol = new Map(s.shipments.map((x) => [x.id, x.bol_number]));

  return s.containers.map((c) => {
    const total_cost = sum(s.costs.filter((x) => x.container_id === c.id).map((x) => x.amount * x.fx_rate));
    const sales = s.sales.filter((x) => x.container_id === c.id);
    const total_revenue = sum(sales.map((x) => x.amount));
    const cartons_sold = sum(sales.map((x) => x.cartons_sold));
    const q = s.quality.filter((x) => x.container_id === c.id);
    const affected = sum(q.map((x) => x.affected_cartons));
    const claims_received = sum(q.map((x) => x.claim_received));
    const cost_per_carton = c.cartons_received > 0 ? total_cost / c.cartons_received : 0;
    // Damage is valued at this container's own cost per carton, net of claims.
    const damage_loss = c.cartons_received > 0
      ? Math.max(affected * cost_per_carton - claims_received, 0) : 0;
    return {
      ...c,
      product_name: c.product_id ? product.get(c.product_id) ?? null : null,
      vendor_name: c.vendor_id ? vendor.get(c.vendor_id) ?? null : null,
      bol_number: c.shipment_id ? bol.get(c.shipment_id) ?? null : null,
      total_cost, total_revenue, cartons_sold, claims_received, cost_per_carton, damage_loss,
      net_profit: total_revenue - total_cost - damage_loss,
    };
  });
}

export type PnlRow = ReturnType<typeof pnlRows>[number];

/** Balance = opening + invoiced (cost entries) − paid. */
export function vendorBalances(s: Ledger) {
  return s.vendors.map((v) => {
    const total_invoiced = sum(s.costs.filter((x) => x.vendor_id === v.id).map((x) => x.amount * x.fx_rate));
    const total_paid = sum(s.payments.filter((x) => x.vendor_id === v.id).map((x) => x.amount));
    return { ...v, total_invoiced, total_paid, balance: v.opening_balance + total_invoiced - total_paid };
  });
}

export const byDateDesc = <T,>(key: (x: T) => string) => (a: T, b: T) => key(b).localeCompare(key(a));
