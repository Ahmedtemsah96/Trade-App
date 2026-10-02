'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/** Every write goes through here, so organization_id is stamped in one place. */
async function scoped() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not signed in');
  const { data: member } = await supabase
    .from('members').select('organization_id').eq('user_id', user.id).single();
  if (!member) throw new Error('No workspace found for this account');
  return { supabase, orgId: member.organization_id as string };
}

const n = (v: FormDataEntryValue | null) => (v === null || v === '' ? null : Number(v));
const s = (v: FormDataEntryValue | null) => (v === null || v === '' ? null : String(v));

type Result = { error?: string };

// ---------------------------------------------------------------- containers

export async function createContainer(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('containers').insert({
      organization_id: orgId,
      container_number: String(form.get('container_number')).trim().toUpperCase(),
      product_id: s(form.get('product_id')),
      vendor_id: s(form.get('vendor_id')),
      shipment_id: s(form.get('shipment_id')),
      origin: s(form.get('origin')),
      destination_port: s(form.get('destination_port')),
      cartons_received: n(form.get('cartons_received')) ?? 0,
      weight_kg: n(form.get('weight_kg')),
      stage: String(form.get('stage') || 'in_transit'),
      arrival_date: s(form.get('arrival_date')),
      notes: s(form.get('notes')),
    });
    if (error) return { error: error.message };
    revalidatePath('/containers'); revalidatePath('/');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function updateContainerStage(id: string, stage: string) {
  const { supabase } = await scoped();
  await supabase.from('containers').update({ stage }).eq('id', id);
  revalidatePath('/containers'); revalidatePath('/');
}

export async function deleteContainer(id: string) {
  const { supabase } = await scoped();
  await supabase.from('containers').delete().eq('id', id);
  revalidatePath('/containers'); revalidatePath('/');
}

// --------------------------------------------------------------------- costs

export async function createCost(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('cost_entries').insert({
      organization_id: orgId,
      container_id: String(form.get('container_id')),
      cost_type: String(form.get('cost_type')),
      amount: n(form.get('amount')) ?? 0,
      currency: String(form.get('currency') || 'SAR'),
      fx_rate: n(form.get('fx_rate')) || 1,
      vendor_id: s(form.get('vendor_id')),
      document_ref: s(form.get('document_ref')),
      description: s(form.get('description')),
      entry_date: s(form.get('entry_date')) ?? new Date().toISOString().slice(0, 10),
    });
    if (error) return { error: error.message };
    revalidatePath('/costs'); revalidatePath('/'); revalidatePath('/containers');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function deleteCost(id: string) {
  const { supabase } = await scoped();
  await supabase.from('cost_entries').delete().eq('id', id);
  revalidatePath('/costs'); revalidatePath('/');
}

// ------------------------------------------------------------------- quality

export async function createQuality(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('quality_events').insert({
      organization_id: orgId,
      container_id: String(form.get('container_id')),
      event_type: String(form.get('event_type')),
      damage_percent: n(form.get('damage_percent')) ?? 0,
      affected_cartons: n(form.get('affected_cartons')) ?? 0,
      claim_received: n(form.get('claim_received')) ?? 0,
      inspected_by: s(form.get('inspected_by')),
      notes: s(form.get('notes')),
      event_date: s(form.get('event_date')) ?? new Date().toISOString().slice(0, 10),
    });
    if (error) return { error: error.message };
    revalidatePath('/quality'); revalidatePath('/');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function deleteQuality(id: string) {
  const { supabase } = await scoped();
  await supabase.from('quality_events').delete().eq('id', id);
  revalidatePath('/quality'); revalidatePath('/');
}

// --------------------------------------------------------------------- sales

export async function createSale(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('sales_entries').insert({
      organization_id: orgId,
      container_id: String(form.get('container_id')),
      cartons_sold: n(form.get('cartons_sold')) ?? 0,
      unit_price: n(form.get('unit_price')) ?? 0,
      vat_amount: n(form.get('vat_amount')) ?? 0,
      customer_name: s(form.get('customer_name')),
      invoice_number: s(form.get('invoice_number')),
      sale_date: s(form.get('sale_date')) ?? new Date().toISOString().slice(0, 10),
      notes: s(form.get('notes')),
    });
    if (error) return { error: error.message };
    revalidatePath('/sales'); revalidatePath('/'); revalidatePath('/containers');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function deleteSale(id: string) {
  const { supabase } = await scoped();
  await supabase.from('sales_entries').delete().eq('id', id);
  revalidatePath('/sales'); revalidatePath('/');
}

// ------------------------------------------------------------------- vendors

export async function createVendor(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('vendors').insert({
      organization_id: orgId,
      name: String(form.get('name')).trim(),
      kind: String(form.get('kind') || 'supplier'),
      country: s(form.get('country')),
      contact_person: s(form.get('contact_person')),
      email: s(form.get('email')),
      phone: s(form.get('phone')),
      payment_terms_days: n(form.get('payment_terms_days')) ?? 30,
      opening_balance: n(form.get('opening_balance')) ?? 0,
    });
    if (error) return { error: error.message };
    revalidatePath('/vendors');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function deleteVendor(id: string) {
  const { supabase } = await scoped();
  await supabase.from('vendors').delete().eq('id', id);
  revalidatePath('/vendors');
}

export async function createPayment(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('vendor_payments').insert({
      organization_id: orgId,
      vendor_id: String(form.get('vendor_id')),
      amount: n(form.get('amount')) ?? 0,
      currency: String(form.get('currency') || 'SAR'),
      bank: s(form.get('bank')),
      reference: s(form.get('reference')),
      payment_date: s(form.get('payment_date')) ?? new Date().toISOString().slice(0, 10),
    });
    if (error) return { error: error.message };
    revalidatePath('/vendors');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

// ------------------------------------------------------------------ products

export async function createProduct(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('products').insert({
      organization_id: orgId,
      name: String(form.get('name')).trim(),
      sku: s(form.get('sku')),
      category: s(form.get('category')),
      origin: s(form.get('origin')),
    });
    if (error) return { error: error.message };
    revalidatePath('/settings'); revalidatePath('/containers');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

export async function deleteProduct(id: string) {
  const { supabase } = await scoped();
  await supabase.from('products').delete().eq('id', id);
  revalidatePath('/settings');
}

// ----------------------------------------------------------------- shipments

export async function createShipment(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('shipments').insert({
      organization_id: orgId,
      bol_number: String(form.get('bol_number')).trim().toUpperCase(),
      vendor_id: s(form.get('vendor_id')),
      vessel_name: s(form.get('vessel_name')),
      origin_port: s(form.get('origin_port')),
      destination_port: s(form.get('destination_port')),
      eta_date: s(form.get('eta_date')),
    });
    if (error) return { error: error.message };
    revalidatePath('/settings'); revalidatePath('/containers');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

// -------------------------------------------------------------- organization

export async function updateOrganization(_: Result, form: FormData): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();
    const { error } = await supabase.from('organizations').update({
      name: String(form.get('name')).trim(),
      vat_number: s(form.get('vat_number')),
      usd_rate: n(form.get('usd_rate')) ?? 3.75,
    }).eq('id', orgId);
    if (error) return { error: error.message };
    revalidatePath('/settings'); revalidatePath('/');
    return {};
  } catch (e: any) { return { error: e.message }; }
}

// ------------------------------------------------------------- demo seeding

export async function seedDemoData(): Promise<Result> {
  try {
    const { supabase, orgId } = await scoped();

    const { data: vendors, error: vErr } = await supabase.from('vendors').insert([
      { organization_id: orgId, name: 'Bakrawy Produce', kind: 'supplier', country: 'Philippines', payment_terms_days: 30 },
      { organization_id: orgId, name: 'Agros Export', kind: 'supplier', country: 'Ecuador', payment_terms_days: 45 },
      { organization_id: orgId, name: 'CMA CGM', kind: 'shipping', country: 'France', payment_terms_days: 15 },
      { organization_id: orgId, name: 'Jusoor Al Arabia', kind: 'clearance', country: 'Saudi Arabia', payment_terms_days: 15 },
    ]).select('id, name');
    if (vErr) return { error: vErr.message };

    const vid = (name: string) => vendors?.find((v) => v.name === name)?.id ?? null;

    const { data: products, error: pErr } = await supabase.from('products').insert([
      { organization_id: orgId, name: 'Banana — Filipino 13kg', sku: 'BAN-PH-13', category: 'Banana', origin: 'Philippines' },
      { organization_id: orgId, name: 'Banana — Ecuador 18kg', sku: 'BAN-EC-18', category: 'Banana', origin: 'Ecuador' },
      { organization_id: orgId, name: 'Lemon — India 15kg', sku: 'LEM-IN-15', category: 'Lemon', origin: 'India' },
    ]).select('id, sku');
    if (pErr) return { error: pErr.message };
    const pid = (sku: string) => products?.find((p) => p.sku === sku)?.id ?? null;

    const { data: shipment } = await supabase.from('shipments').insert({
      organization_id: orgId, bol_number: 'CMDUSIN0492817', vendor_id: vid('Bakrawy Produce'),
      vessel_name: 'CMA CGM Jules Verne', origin_port: 'Davao', destination_port: 'Dammam',
      eta_date: '2026-03-04',
    }).select('id').single();

    const { data: containers, error: cErr } = await supabase.from('containers').insert([
      { organization_id: orgId, container_number: 'SEGU9970606', shipment_id: shipment?.id,
        product_id: pid('BAN-PH-13'), vendor_id: vid('Bakrawy Produce'), origin: 'Philippines',
        destination_port: 'Dammam', cartons_received: 1556, weight_kg: 20228, stage: 'closed',
        arrival_date: '2026-03-04' },
      { organization_id: orgId, container_number: 'DFOU6162688', shipment_id: shipment?.id,
        product_id: pid('BAN-PH-13'), vendor_id: vid('Bakrawy Produce'), origin: 'Philippines',
        destination_port: 'Dammam', cartons_received: 1556, weight_kg: 20228, stage: 'selling',
        arrival_date: '2026-03-04' },
      { organization_id: orgId, container_number: 'CGMU9345140',
        product_id: pid('BAN-EC-18'), vendor_id: vid('Agros Export'), origin: 'Ecuador',
        destination_port: 'Jeddah', cartons_received: 1240, weight_kg: 22320, stage: 'fermenting',
        arrival_date: '2026-03-18' },
      { organization_id: orgId, container_number: 'FSCU5360035',
        product_id: pid('LEM-IN-15'), vendor_id: vid('Agros Export'), origin: 'India',
        destination_port: 'Dammam', cartons_received: 1800, weight_kg: 27000, stage: 'in_transit' },
    ]).select('id, container_number');
    if (cErr) return { error: cErr.message };
    const cid = (nu: string) => containers?.find((c) => c.container_number === nu)?.id!;

    const costRows: any[] = [];
    const addCosts = (container: string, goods: number, freight: number, clearance: number, ferm: number) => {
      costRows.push(
        { organization_id: orgId, container_id: cid(container), cost_type: 'goods', amount: goods, vendor_id: vid('Bakrawy Produce'), entry_date: '2026-03-01', document_ref: 'CI-' + container.slice(-4) },
        { organization_id: orgId, container_id: cid(container), cost_type: 'ocean_freight', amount: freight, vendor_id: vid('CMA CGM'), entry_date: '2026-03-02' },
        { organization_id: orgId, container_id: cid(container), cost_type: 'clearance', amount: clearance, vendor_id: vid('Jusoor Al Arabia'), entry_date: '2026-03-05' },
        { organization_id: orgId, container_id: cid(container), cost_type: 'inland_transport', amount: 2400, vendor_id: vid('Jusoor Al Arabia'), entry_date: '2026-03-05' },
        { organization_id: orgId, container_id: cid(container), cost_type: 'labor', amount: 1150, entry_date: '2026-03-06' },
        { organization_id: orgId, container_id: cid(container), cost_type: 'overhead', amount: 133.33, entry_date: '2026-03-06' },
      );
      if (ferm) costRows.push({ organization_id: orgId, container_id: cid(container), cost_type: 'fermentation', amount: ferm, entry_date: '2026-03-08' });
    };
    addCosts('SEGU9970606', 34500, 9200, 6400, 4100);
    addCosts('DFOU6162688', 34500, 9200, 6400, 4100);
    addCosts('CGMU9345140', 29800, 11400, 7100, 3600);
    costRows.push({ organization_id: orgId, container_id: cid('FSCU5360035'), cost_type: 'goods', amount: 41200, vendor_id: vid('Agros Export'), entry_date: '2026-03-20' });

    const { error: ceErr } = await supabase.from('cost_entries').insert(costRows);
    if (ceErr) return { error: ceErr.message };

    const { error: seErr } = await supabase.from('sales_entries').insert([
      { organization_id: orgId, container_id: cid('SEGU9970606'), cartons_sold: 1478, unit_price: 53, customer_name: 'Riyadh Central Market', invoice_number: 'INV-2026-0141', sale_date: '2026-03-12' },
      { organization_id: orgId, container_id: cid('DFOU6162688'), cartons_sold: 900, unit_price: 54.5, customer_name: 'Dammam Wholesale', invoice_number: 'INV-2026-0147', sale_date: '2026-03-14' },
      { organization_id: orgId, container_id: cid('DFOU6162688'), cartons_sold: 520, unit_price: 49, customer_name: 'Qassim Distribution', invoice_number: 'INV-2026-0155', sale_date: '2026-03-19' },
      { organization_id: orgId, container_id: cid('CGMU9345140'), cartons_sold: 610, unit_price: 61, customer_name: 'Jeddah Retail Group', invoice_number: 'INV-2026-0162', sale_date: '2026-03-26' },
    ]);
    if (seErr) return { error: seErr.message };

    const { error: qErr } = await supabase.from('quality_events').insert([
      { organization_id: orgId, container_id: cid('SEGU9970606'), event_type: 'insurance', damage_percent: 5, affected_cartons: 78, claim_received: 2000, inspected_by: 'Warehouse QC', notes: 'Bruising on upper tiers', event_date: '2026-03-05' },
      { organization_id: orgId, container_id: cid('DFOU6162688'), event_type: 'ripple', damage_percent: 8.6, affected_cartons: 134, claim_received: 0, inspected_by: 'Warehouse QC', notes: 'Cosmetic — moved to salvage', event_date: '2026-03-07' },
      { organization_id: orgId, container_id: cid('CGMU9345140'), event_type: 'insurance', damage_percent: 3.1, affected_cartons: 38, claim_received: 1450, inspected_by: 'Surveyor', event_date: '2026-03-20' },
    ]);
    if (qErr) return { error: qErr.message };

    await supabase.from('vendor_payments').insert([
      { organization_id: orgId, vendor_id: vid('Bakrawy Produce'), amount: 69000, bank: 'Al Rajhi', reference: 'TT-88214', payment_date: '2026-03-15' },
      { organization_id: orgId, vendor_id: vid('CMA CGM'), amount: 18400, bank: 'Al Jazira', reference: 'TT-88230', payment_date: '2026-03-16' },
    ]);

    revalidatePath('/'); revalidatePath('/containers'); revalidatePath('/costs');
    revalidatePath('/sales'); revalidatePath('/quality'); revalidatePath('/vendors');
    return {};
  } catch (e: any) { return { error: e.message }; }
}
