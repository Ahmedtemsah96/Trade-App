import { useSyncExternalStore } from 'react';

export type Vendor = { id: string; name: string; kind: string; country: string | null; contact_person: string | null; email: string | null; phone: string | null; payment_terms_days: number; opening_balance: number };
export type Product = { id: string; name: string; sku: string | null; category: string | null; origin: string | null };
export type Shipment = { id: string; bol_number: string; vendor_id: string | null; vessel_name: string | null; origin_port: string | null; destination_port: string | null; eta_date: string | null };
export type Container = { id: string; container_number: string; shipment_id: string | null; product_id: string | null; vendor_id: string | null; origin: string | null; destination_port: string | null; cartons_received: number; weight_kg: number | null; stage: string; arrival_date: string | null; created_at: string };
export type Cost = { id: string; container_id: string; cost_type: string; amount: number; currency: string; fx_rate: number; vendor_id: string | null; document_ref: string | null; description: string | null; entry_date: string };
export type Quality = { id: string; container_id: string; event_type: string; damage_percent: number; affected_cartons: number; claim_received: number; inspected_by: string | null; notes: string | null; event_date: string };
export type Sale = { id: string; container_id: string; cartons_sold: number; unit_price: number; amount: number; customer_name: string | null; invoice_number: string | null; vat_amount: number; sale_date: string; notes: string | null };
export type Payment = { id: string; vendor_id: string; amount: number; currency: string; bank: string | null; reference: string | null; payment_date: string };

export type Ledger = {
  company: { name: string; vat_number: string; usd_rate: number };
  vendors: Vendor[]; products: Product[]; shipments: Shipment[]; containers: Container[];
  costs: Cost[]; quality: Quality[]; sales: Sale[]; payments: Payment[];
};

const KEY = 'container-ledger-v1';
const LISTS = ['vendors', 'products', 'shipments', 'containers', 'costs', 'quality', 'sales', 'payments'] as const;

export const emptyLedger = (): Ledger => ({
  company: { name: 'My company', vat_number: '', usd_rate: 3.75 },
  vendors: [], products: [], shipments: [], containers: [], costs: [], quality: [], sales: [], payments: [],
});

/** Accepts anything parsed from storage or a backup file; returns a safe Ledger or null. */
export function parseLedger(raw: unknown): Ledger | null {
  if (!raw || typeof raw !== 'object') return null;
  const o = raw as Record<string, unknown>;
  const base = emptyLedger();
  for (const k of LISTS) {
    if (o[k] === undefined) continue;
    if (!Array.isArray(o[k])) return null;
    (base as any)[k] = o[k];
  }
  if (o.company && typeof o.company === 'object') base.company = { ...base.company, ...(o.company as object) };
  if (!LISTS.some((k) => o[k] !== undefined) && !o.company) return null;
  return base;
}

function load(): Ledger {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return parseLedger(JSON.parse(raw)) ?? emptyLedger();
  } catch { /* storage blocked or corrupt: start empty */ }
  return emptyLedger();
}

let state = load();
let saveFailed = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function commit(next: Ledger) {
  state = next;
  try { localStorage.setItem(KEY, JSON.stringify(next)); saveFailed = false; }
  catch { saveFailed = true; }
  emit();
}

// Another tab changed the ledger: pick it up instead of overwriting it later.
window.addEventListener('storage', (e) => { if (e.key === KEY) { state = load(); emit(); } });

const subscribe = (l: () => void) => { listeners.add(l); return () => listeners.delete(l); };
export const useLedger = () => useSyncExternalStore(subscribe, () => state);
export const useSaveFailed = () => useSyncExternalStore(subscribe, () => saveFailed);
export const getLedger = () => state;
export const update = (fn: (s: Ledger) => Ledger) => commit(fn(state));
export const replaceLedger = (l: Ledger) => commit(l);

export const uid = () =>
  globalThis.crypto?.randomUUID?.() ?? 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
export const today = () => new Date().toISOString().slice(0, 10);
