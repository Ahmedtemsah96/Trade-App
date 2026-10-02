export const money = (n: number | null | undefined, currency = 'SAR') =>
  `${currency} ${Number(n ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const compact = (n: number | null | undefined) => {
  const v = Number(n ?? 0);
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toFixed(0);
};

export const num = (n: number | null | undefined, dp = 0) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: dp, maximumFractionDigits: dp });

export const pct = (n: number | null | undefined) => `${Number(n ?? 0).toFixed(1)}%`;

export const COST_TYPES = [
  ['goods', 'Goods / supplier invoice'],
  ['ocean_freight', 'Ocean freight'],
  ['agent_fee', 'Agent fee'],
  ['clearance', 'Customs clearance'],
  ['port_charges', 'Port charges'],
  ['inland_transport', 'Inland transport'],
  ['penalty', 'Penalty / demurrage'],
  ['fermentation', 'Fermentation'],
  ['labor', 'Labour'],
  ['overhead', 'Overhead'],
  ['other', 'Other'],
] as const;

export const STAGES = [
  ['in_transit', 'In transit'],
  ['cleared', 'Cleared'],
  ['warehoused', 'Warehoused'],
  ['fermenting', 'Fermenting'],
  ['selling', 'Selling'],
  ['closed', 'Closed'],
] as const;

export const VENDOR_KINDS = [
  ['supplier', 'Supplier'],
  ['shipping', 'Shipping line'],
  ['clearance', 'Clearance agent'],
  ['transport', 'Transport'],
  ['fermentation', 'Fermentation room'],
  ['other', 'Other'],
] as const;

export const QUALITY_TYPES = [
  ['insurance', 'Insurance claim'],
  ['ripple', 'Ripple / cosmetic'],
  ['market_salvage', 'Market salvage'],
  ['total_loss', 'Total loss'],
  ['other', 'Other'],
] as const;

export const label = (list: readonly (readonly [string, string])[], v: string) =>
  list.find(([k]) => k === v)?.[1] ?? v;
