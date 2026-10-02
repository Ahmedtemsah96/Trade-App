# Container Ledger — setup

A multi-tenant ERP for produce importers. Each container is a cost centre; goods, freight,
clearance, fermentation, labour and overhead post against it, sales post against it, and margin
per carton falls out of the difference.

Three things to do: create the database, connect it, run it. About ten minutes.

---

## Before you start

Node.js 18 or newer. Check with `node --version`. If that errors, install the LTS build from
nodejs.org and open a new terminal.

**Put this folder somewhere short and outside OneDrive.** `C:\dev\container-ledger` is good.
A OneDrive path breaks `npm install` in two ways: the path is long enough to hit Windows' limit,
and OneDrive's sync engine locks files mid-install. This is what went wrong if you have tried
before and files went missing.

---

## 1. Create the database

1. Go to supabase.com, sign up, click **New project**.
2. Name it, set a database password (save it somewhere), pick the region closest to you —
   **Frankfurt** or **Singapore** from Saudi Arabia.
3. Wait about two minutes for it to finish provisioning.
4. Open **SQL Editor** → **New query**.
5. Open `supabase/schema.sql` from this folder, copy all of it, paste it in, click **Run**.

You should see "Success. No rows returned." That one script creates every table, the container
P&L view, the vendor balance view, the signup trigger and the row-level security policies.

### What the security policies do

Every table carries an `organization_id`, and each policy says a row is only visible when that
column matches the caller's own organization. The check runs inside Postgres, not in the app
code, so a bug in a page cannot leak one customer's containers to another. This is the part that
makes it safe to sell the same instance to several importers.

---

## 2. Connect it

In Supabase: **Project Settings** → **API**. Copy the **Project URL** and the **anon public** key.

Create a file named exactly `.env.local` in this folder:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

There is a template at `.env.local.example` you can rename.

The anon key is safe in the browser — it is designed to be public, and the security policies from
step 1 are what actually restrict access. Never put the `service_role` key in this file.

---

## 3. Run it

```
npm install
npm run dev
```

Open http://localhost:3000. Choose **Set up a new company workspace**, enter your company name
and an email and password. That creates your organization and makes you its admin.

On the empty overview, **Load sample data** puts four containers with costs, sales and quality
events in so you can see how it behaves. Every row has a Remove link when you want it gone.

---

## What's in it

| Page | What it does |
|---|---|
| Overview | Landed cost, revenue, net margin, damage written off; margin per container; cost mix |
| Containers | Register containers, see cost per carton and margin on each |
| Costs | Post goods, freight, agent fees, clearance, port, transport, penalty, fermentation, labour, overhead — in SAR, USD or EUR |
| Quality | Damage valued at that container's own cost per carton, net of insurer claims |
| Sales | Cartons out, price, customer, invoice, output VAT |
| Vendors | Balance = opening + invoiced − paid, per vendor, with payment records |
| Settings | Company and VAT details, USD rate, products, bills of lading |

### How margin is worked out

```
cost per carton   = total posted cost ÷ cartons received
damage loss       = affected cartons × cost per carton − claims received   (floored at zero)
net profit        = revenue − total cost − damage loss
```

Foreign-currency costs are stored in their original currency alongside the rate you entered, so
the invoice still reconciles to the vendor's paperwork while the books stay in SAR.

---

## Going live

```
git init
git add .
git commit -m "Container Ledger"
git remote add origin https://github.com/YOUR-USERNAME/container-ledger.git
git push -u origin main
```

Then at vercel.com: **Add New** → **Project** → import the repo. Add the same two environment
variables from step 2 in the Vercel dialog, and deploy. Pushes to `main` redeploy automatically.

---

## If something breaks

**`Could not read package.json`** — your terminal is in the wrong folder. `cd` into the folder
that contains `package.json` and check with `dir` (Windows) or `ls`.

**`'next' is not recognized`** — `npm install` has not finished successfully in this folder. Run
it again and read the output for the real error.

**"Connect your database first" on the login screen** — `.env.local` is missing, misnamed, or the
dev server was not restarted after you created it. Stop it with Ctrl+C and run `npm run dev` again.

**Signed in but every page is empty** — the schema script did not finish. Re-run it in the SQL
Editor and check for a red error. If your Supabase project predates Postgres 15, the
`security_invoker` views will fail; create a new project rather than working around it.

**`new row violates row-level security policy`** — your account has no row in `members`. That
happens if the signup trigger was not in place when you registered. Re-run the schema, then sign
up with a fresh email.

---

## Not built yet

Worth knowing before you show it to a customer: inviting teammates has no interface yet (roles
exist in the database and are enforceable, but you would add members by hand in Supabase),
there is no ZATCA e-invoice submission, no bank reconciliation, no PDF export, and no billing
or subscription handling.
