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

1. Go to neon.tech, sign up (the free plan is enough), click **New project**.
2. Name it, pick Postgres 16 or newer, and the region closest to you —
   **Frankfurt** (AWS eu-central-1) from Saudi Arabia.
3. On the project dashboard click **Connect** and copy the connection string. It looks like
   `postgresql://neondb_owner:...@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require`.

Keep this string private: it is the password to your whole database.

---

## 2. Connect it

Create a file named exactly `.env.local` in this folder:

```
DATABASE_URL=postgresql://neondb_owner:...@ep-xxxx-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require
AUTH_SECRET=paste-a-random-string-here
```

There is a template at `.env.local.example` you can rename. `AUTH_SECRET` signs the login
cookies; make one with:

```
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Then create the tables:

```
npm install
npm run db:setup
```

You should see "Schema applied." That one script (`db/schema.sql`) creates every table, the
container P&L view, the vendor balance view and the row-level security policies. It is safe to
run again. If you prefer, you can instead paste `db/schema.sql` into Neon's **SQL Editor** and
click **Run**.

### What the security policies do

Every table carries an `organization_id`, and each policy says a row is only visible when that
column matches the organization the request is acting for. The app runs every query as a
restricted database role (`ledger_app`) that cannot switch those policies off, so the check
runs inside Postgres, not in the app code: a bug in a page cannot leak one customer's
containers to another. This is the part that makes it safe to sell the same instance to
several importers.

Both values in `.env.local` are secrets and stay on the server. Never commit `.env.local`
(it is already in `.gitignore`).

---

## 3. Run it

```
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
variables from step 2 (`DATABASE_URL` and `AUTH_SECRET`) in the Vercel dialog, and deploy. Pushes to `main` redeploy automatically.

---

## If something breaks

**`Could not read package.json`** — your terminal is in the wrong folder. `cd` into the folder
that contains `package.json` and check with `dir` (Windows) or `ls`.

**`'next' is not recognized`** — `npm install` has not finished successfully in this folder. Run
it again and read the output for the real error.

**"Connect your database first" on the login screen** — `.env.local` is missing, misnamed, lacks
one of the two values, or the dev server was not restarted after you created it. Stop it with
Ctrl+C and run `npm run dev` again.

**`relation "users" does not exist`** or **`role "ledger_app" does not exist`** — the schema has
not been applied to this database. Run `npm run db:setup`.

**`permission denied to grant role`** while applying the schema — the connection string is for
a role that cannot create roles. Use the project's owner role (`neondb_owner` on Neon).

**Signup says "Something went wrong"** — the app cannot reach the database. Check that
`DATABASE_URL` is copied in full, including `?sslmode=require`.

## Not built yet

Worth knowing before you show it to a customer: inviting teammates has no interface yet (roles
exist in the database and are enforceable, but adding a teammate today means writing rows into `users` and `members` directly),
there is no ZATCA e-invoice submission, no bank reconciliation, no PDF export, no password reset or email verification, and no billing
or subscription handling.
