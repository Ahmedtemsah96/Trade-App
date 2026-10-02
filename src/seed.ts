import { update, uid, getLedger } from './store';
import type { Cost } from './store';

const FIRST = 'SEGU9970606';

/** Four containers with costs, sales and quality events. Returns an error string, or nothing. */
export function loadSampleData(): string | void {
  if (getLedger().containers.some((c) => c.container_number === FIRST)) return 'Sample data is already loaded.';

  const mk = (name: string, kind: string, country: string, terms: number) => ({
    id: uid(), name, kind, country, contact_person: null, email: null, phone: null,
    payment_terms_days: terms, opening_balance: 0,
  });
  const bak = mk('Bakrawy Produce', 'supplier', 'Philippines', 30);
  const agr = mk('Agros Export', 'supplier', 'Ecuador', 45);
  const cma = mk('CMA CGM', 'shipping', 'France', 15);
  const jus = mk('Jusoor Al Arabia', 'clearance', 'Saudi Arabia', 15);

  const prod = (name: string, sku: string, category: string, origin: string) => ({ id: uid(), name, sku, category, origin });
  const banPh = prod('Banana — Filipino 13kg', 'BAN-PH-13', 'Banana', 'Philippines');
  const banEc = prod('Banana — Ecuador 18kg', 'BAN-EC-18', 'Banana', 'Ecuador');
  const lemIn = prod('Lemon — India 15kg', 'LEM-IN-15', 'Lemon', 'India');

  const ship = { id: uid(), bol_number: 'CMDUSIN0492817', vendor_id: bak.id, vessel_name: 'CMA CGM Jules Verne',
    origin_port: 'Davao', destination_port: 'Dammam', eta_date: '2026-03-04' };

  const now = new Date().toISOString();
  const cont = (n: string, p: typeof banPh, v: typeof bak, origin: string, port: string, cartons: number, kg: number, stage: string, arrival: string | null, shipment: string | null) => ({
    id: uid(), container_number: n, shipment_id: shipment, product_id: p.id, vendor_id: v.id, origin,
    destination_port: port, cartons_received: cartons, weight_kg: kg, stage, arrival_date: arrival, created_at: now,
  });
  const c1 = cont(FIRST, banPh, bak, 'Philippines', 'Dammam', 1556, 20228, 'closed', '2026-03-04', ship.id);
  const c2 = cont('DFOU6162688', banPh, bak, 'Philippines', 'Dammam', 1556, 20228, 'selling', '2026-03-04', ship.id);
  const c3 = cont('CGMU9345140', banEc, agr, 'Ecuador', 'Jeddah', 1240, 22320, 'fermenting', '2026-03-18', null);
  const c4 = cont('FSCU5360035', lemIn, agr, 'India', 'Dammam', 1800, 27000, 'in_transit', null, null);

  const costs: Cost[] = [];
  const add = (container: string, type: string, amount: number, vendor: string | null, date: string, ref: string | null = null) =>
    costs.push({ id: uid(), container_id: container, cost_type: type, amount, currency: 'SAR', fx_rate: 1,
      vendor_id: vendor, document_ref: ref, description: null, entry_date: date });
  const full = (c: typeof c1, supplier: typeof bak, goods: number, freight: number, clearance: number, ferm: number) => {
    add(c.id, 'goods', goods, supplier.id, '2026-03-01', 'CI-' + c.container_number.slice(-4));
    add(c.id, 'ocean_freight', freight, cma.id, '2026-03-02');
    add(c.id, 'clearance', clearance, jus.id, '2026-03-05');
    add(c.id, 'inland_transport', 2400, jus.id, '2026-03-05');
    add(c.id, 'labor', 1150, null, '2026-03-06');
    add(c.id, 'overhead', 133.33, null, '2026-03-06');
    if (ferm) add(c.id, 'fermentation', ferm, null, '2026-03-08');
  };
  full(c1, bak, 34500, 9200, 6400, 4100);
  full(c2, bak, 34500, 9200, 6400, 4100);
  full(c3, agr, 29800, 11400, 7100, 3600);
  add(c4.id, 'goods', 41200, agr.id, '2026-03-20');

  const sale = (c: typeof c1, cartons: number, price: number, customer: string, inv: string, date: string) => ({
    id: uid(), container_id: c.id, cartons_sold: cartons, unit_price: price, amount: cartons * price,
    customer_name: customer, invoice_number: inv, vat_amount: 0, sale_date: date, notes: null });
  const qe = (c: typeof c1, type: string, pct: number, cartons: number, claim: number, by: string, notes: string | null, date: string) => ({
    id: uid(), container_id: c.id, event_type: type, damage_percent: pct, affected_cartons: cartons,
    claim_received: claim, inspected_by: by, notes, event_date: date });
  const pay = (v: typeof bak, amount: number, bank: string, ref: string, date: string) => ({
    id: uid(), vendor_id: v.id, amount, currency: 'SAR', bank, reference: ref, payment_date: date });

  update((s) => ({
    ...s,
    vendors: [...s.vendors, bak, agr, cma, jus],
    products: [...s.products, banPh, banEc, lemIn],
    shipments: [...s.shipments, ship],
    containers: [...s.containers, c1, c2, c3, c4],
    costs: [...s.costs, ...costs],
    sales: [...s.sales,
      sale(c1, 1478, 53, 'Riyadh Central Market', 'INV-2026-0141', '2026-03-12'),
      sale(c2, 900, 54.5, 'Dammam Wholesale', 'INV-2026-0147', '2026-03-14'),
      sale(c2, 520, 49, 'Qassim Distribution', 'INV-2026-0155', '2026-03-19'),
      sale(c3, 610, 61, 'Jeddah Retail Group', 'INV-2026-0162', '2026-03-26')],
    quality: [...s.quality,
      qe(c1, 'insurance', 5, 78, 2000, 'Warehouse QC', 'Bruising on upper tiers', '2026-03-05'),
      qe(c2, 'ripple', 8.6, 134, 0, 'Warehouse QC', 'Cosmetic — moved to salvage', '2026-03-07'),
      qe(c3, 'insurance', 3.1, 38, 1450, 'Surveyor', null, '2026-03-20')],
    payments: [...s.payments,
      pay(bak, 69000, 'Al Rajhi', 'TT-88214', '2026-03-15'),
      pay(cma, 18400, 'Al Jazira', 'TT-88230', '2026-03-16')],
  }));
}
