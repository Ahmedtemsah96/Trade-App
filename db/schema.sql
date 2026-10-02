-- =====================================================================
-- Container Ledger — multi-tenant schema (PostgreSQL 15+, e.g. Neon)
-- Apply with `npm run db:setup`, or paste into the Neon SQL Editor and run.
-- Safe to re-run.
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

-- ---------------------------------------------------------------------
-- Tenancy
-- ---------------------------------------------------------------------

create table if not exists organizations (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  vat_number  text,
  base_currency text not null default 'SAR',
  usd_rate    numeric(10,4) not null default 3.7500,
  created_at  timestamptz not null default now()
);

-- Login accounts. Only the sign-in code touches this table; the app role
-- used for business queries has no access to it.
create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  password_hash text not null,
  created_at    timestamptz not null default now()
);
create unique index if not exists users_email_idx on users (lower(email));

create table if not exists members (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null unique references users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  full_name       text,
  email           text,
  role            text not null default 'admin'
                  check (role in ('admin','procurement','finance','warehouse','executive','viewer')),
  created_at      timestamptz not null default now()
);

create index if not exists members_org_idx on members(organization_id);

-- The organization the current transaction acts for. The app sets it with
-- set_config('app.org_id', ..., true) at the start of every transaction;
-- unset means "no organization", so every policy below matches nothing.
create or replace function current_org_id()
returns uuid
language sql stable
as $$ select nullif(current_setting('app.org_id', true), '')::uuid $$;

-- ---------------------------------------------------------------------
-- Master data
-- ---------------------------------------------------------------------

create table if not exists vendors (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  kind            text not null default 'supplier'
                  check (kind in ('supplier','shipping','clearance','transport','fermentation','other')),
  country         text,
  contact_person  text,
  email           text,
  phone           text,
  payment_terms_days int default 30,
  opening_balance numeric(14,2) not null default 0,
  created_at      timestamptz not null default now()
);
create index if not exists vendors_org_idx on vendors(organization_id);

create table if not exists products (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  sku             text,
  category        text,
  origin          text,
  created_at      timestamptz not null default now()
);
create index if not exists products_org_idx on products(organization_id);

-- ---------------------------------------------------------------------
-- Operations. One container = one cost center.
-- ---------------------------------------------------------------------

create table if not exists shipments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  bol_number      text not null,
  vendor_id       uuid references vendors(id) on delete set null,
  vessel_name     text,
  origin_port     text,
  destination_port text,
  eta_date        date,
  notes           text,
  created_at      timestamptz not null default now(),
  unique (organization_id, bol_number)
);
create index if not exists shipments_org_idx on shipments(organization_id);

create table if not exists containers (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  container_number text not null,
  shipment_id      uuid references shipments(id) on delete set null,
  product_id       uuid references products(id) on delete set null,
  vendor_id        uuid references vendors(id) on delete set null,
  origin           text,
  destination_port text,
  cartons_received integer not null default 0,
  weight_kg        numeric(12,2),
  stage            text not null default 'in_transit'
                   check (stage in ('in_transit','cleared','warehoused','fermenting','selling','closed')),
  location         text,
  arrival_date     date,
  notes            text,
  created_at       timestamptz not null default now(),
  unique (organization_id, container_number)
);
create index if not exists containers_org_idx on containers(organization_id);
create index if not exists containers_shipment_idx on containers(shipment_id);

create table if not exists cost_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  container_id    uuid not null references containers(id) on delete cascade,
  cost_type       text not null
                  check (cost_type in ('goods','ocean_freight','agent_fee','clearance','port_charges',
                                       'inland_transport','penalty','fermentation','labor','overhead','other')),
  amount          numeric(14,2) not null,
  currency        text not null default 'SAR',
  fx_rate         numeric(10,4) not null default 1,
  vendor_id       uuid references vendors(id) on delete set null,
  document_ref    text,
  description     text,
  entry_date      date not null default current_date,
  created_at      timestamptz not null default now()
);
create index if not exists cost_entries_org_idx on cost_entries(organization_id);
create index if not exists cost_entries_container_idx on cost_entries(container_id);

create table if not exists quality_events (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  container_id    uuid not null references containers(id) on delete cascade,
  event_type      text not null default 'insurance'
                  check (event_type in ('insurance','ripple','market_salvage','total_loss','other')),
  damage_percent  numeric(6,2) not null default 0,
  affected_cartons integer not null default 0,
  claim_received  numeric(14,2) not null default 0,
  inspected_by    text,
  notes           text,
  event_date      date not null default current_date,
  created_at      timestamptz not null default now()
);
create index if not exists quality_org_idx on quality_events(organization_id);
create index if not exists quality_container_idx on quality_events(container_id);

create table if not exists sales_entries (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  container_id    uuid not null references containers(id) on delete cascade,
  cartons_sold    integer not null,
  unit_price      numeric(12,2) not null,
  amount          numeric(14,2) generated always as (cartons_sold * unit_price) stored,
  customer_name   text,
  invoice_number  text,
  vat_amount      numeric(14,2) not null default 0,
  sale_date       date not null default current_date,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists sales_org_idx on sales_entries(organization_id);
create index if not exists sales_container_idx on sales_entries(container_id);

create table if not exists vendor_payments (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  vendor_id       uuid not null references vendors(id) on delete cascade,
  amount          numeric(14,2) not null,
  currency        text not null default 'SAR',
  bank            text,
  reference       text,
  payment_date    date not null default current_date,
  created_at      timestamptz not null default now()
);
create index if not exists payments_org_idx on vendor_payments(organization_id);

-- ---------------------------------------------------------------------
-- Container P&L — the number everyone actually wants
-- ---------------------------------------------------------------------

create or replace view container_pnl
with (security_invoker = on) as
select
  c.id,
  c.organization_id,
  c.container_number,
  c.stage,
  c.origin,
  c.cartons_received,
  c.arrival_date,
  c.created_at,
  p.name  as product_name,
  v.name  as vendor_name,
  s.bol_number,
  coalesce(cost.total, 0)                                   as total_cost,
  coalesce(rev.total, 0)                                    as total_revenue,
  coalesce(rev.cartons_sold, 0)                             as cartons_sold,
  coalesce(q.claim_received, 0)                             as claims_received,
  coalesce(q.damage_percent, 0)                             as damage_percent,
  case when c.cartons_received > 0
       then coalesce(cost.total,0) / c.cartons_received end as cost_per_carton,
  -- damage loss is valued at cost, net of anything the insurer paid back
  greatest(
    case when c.cartons_received > 0
         then (coalesce(q.affected_cartons,0) * (coalesce(cost.total,0) / c.cartons_received))
            - coalesce(q.claim_received,0)
         else 0 end, 0)                                     as damage_loss,
  coalesce(rev.total,0) - coalesce(cost.total,0) - greatest(
    case when c.cartons_received > 0
         then (coalesce(q.affected_cartons,0) * (coalesce(cost.total,0) / c.cartons_received))
            - coalesce(q.claim_received,0)
         else 0 end, 0)                                     as net_profit
from containers c
left join products p on p.id = c.product_id
left join vendors  v on v.id = c.vendor_id
left join shipments s on s.id = c.shipment_id
left join lateral (
  select sum(amount * fx_rate) as total
  from cost_entries ce where ce.container_id = c.id
) cost on true
left join lateral (
  select sum(amount) as total, sum(cartons_sold) as cartons_sold
  from sales_entries se where se.container_id = c.id
) rev on true
left join lateral (
  select sum(affected_cartons) as affected_cartons,
         sum(claim_received)   as claim_received,
         sum(damage_percent)   as damage_percent
  from quality_events qe where qe.container_id = c.id
) q on true;

create or replace view vendor_balances
with (security_invoker = on) as
select
  v.id,
  v.organization_id,
  v.name,
  v.kind,
  v.country,
  v.payment_terms_days,
  v.opening_balance
    + coalesce(inv.total, 0)
    - coalesce(pay.total, 0)                as balance,
  coalesce(inv.total, 0)                    as total_invoiced,
  coalesce(pay.total, 0)                    as total_paid
from vendors v
left join lateral (
  select sum(amount * fx_rate) as total from cost_entries ce where ce.vendor_id = v.id
) inv on true
left join lateral (
  select sum(amount) as total from vendor_payments vp where vp.vendor_id = v.id
) pay on true;

-- ---------------------------------------------------------------------
-- Row level security — this is what makes it multi-tenant
-- ---------------------------------------------------------------------

-- The app runs every business query as this role (SET LOCAL ROLE), not as
-- the database owner. Owners and Neon's admin roles bypass row-level
-- security; ledger_app does not, so the policies always apply to it.
do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'ledger_app') then
    create role ledger_app nologin;
  end if;
end $$;
grant ledger_app to current_user;

grant usage on schema public to ledger_app;
grant select, insert, update, delete on
  organizations, members, vendors, products, shipments, containers,
  cost_entries, quality_events, sales_entries, vendor_payments
  to ledger_app;
grant select on container_pnl, vendor_balances to ledger_app;
revoke all on users from ledger_app;

alter table organizations  enable row level security;
alter table members        enable row level security;
alter table vendors        enable row level security;
alter table products       enable row level security;
alter table shipments      enable row level security;
alter table containers     enable row level security;
alter table cost_entries   enable row level security;
alter table quality_events enable row level security;
alter table sales_entries  enable row level security;
alter table vendor_payments enable row level security;

drop policy if exists org_self on organizations;
create policy org_self on organizations
  for all using (id = current_org_id()) with check (id = current_org_id());

drop policy if exists members_self on members;
create policy members_self on members
  for all using (organization_id = current_org_id())
  with check (organization_id = current_org_id());

do $$
declare t text;
begin
  for t in
    select unnest(array['vendors','products','shipments','containers',
                        'cost_entries','quality_events','sales_entries','vendor_payments'])
  loop
    execute format('drop policy if exists tenant_isolation on %I', t);
    execute format(
      'create policy tenant_isolation on %I for all
         using (organization_id = current_org_id())
         with check (organization_id = current_org_id())', t);
  end loop;
end $$;

-- Done. Every business query is scoped to the caller's organization by the
-- database itself, not by application code.
