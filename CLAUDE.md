# KP Prompt Creator — Deployment & Agent Doc

A Vanilla-JS static site fronting Vercel serverless functions and Supabase
(Auth, Postgres, Storage). The product now runs **three systems** only.

## ⚠️ Removed (do not reference)

The following were **removed** from the codebase and database:

- **Prompt marketplace** — selling/buying prompts: prompt CRUD, reviews, orders,
  seller dashboard, payouts + commission, credit-funded purchases, and the
  KP-fingerprint anti-piracy layer. Deleted pages `marketplace.html`,
  `prompt-detail.html`, `dashboard.html`, `orders.html`; deleted `js/marketplace.js`;
  deleted APIs `/api/prompts/*`, `/api/orders`, `/api/reviews`, `/api/seller/*`,
  `/api/images/*`, `/api/admin/prompts`, `/api/admin/payouts`; deleted
  `lib/prompt-verify.js`. RPCs `purchase_prompt()` / `request_payout()` and the
  `update_prompt_rating` trigger were dropped.
- **Old codegen-orders v1 flow** — `/api/codegen-orders/*` and
  `/api/admin/codegen-orders`. Superseded by GAS Builder; the `codegen_orders`
  table was renamed to `gas_orders`.
- **Credit / top-up wallet** — TrueMoney อั่งเปา redeem: `topup.html`,
  `/api/topup/*`, `/api/credits/*`, `/api/admin/topups`. The
  `users.credit_balance / promptpay_number / promptpay_name` columns and the
  `commission_rate` setting were dropped. **Courses are now sold via PromptPay
  SLIP only.**

> DB removal landed in `supabase/migrations/20260525_01_drop_marketplace.sql`
> (plus `_02`..`_06` for the GAS Builder pivot). `supabase/schema.sql` is the
> HISTORICAL pre-pivot schema and must not be re-run — the migrations are the
> source of truth.

---

## The three kept systems

### 1. Prompt Creator
The original tool (`index.html` + `js/app.js` …). Generates instruction files
(e.g. `CLAUDE.md` / agent prompts) for a target AI from the user's project
inputs. Anonymous usage is tracked via `prompt_stats` / `feature_votes`.

**Save-Prompt personal library** — signed-in users can save generated prompts
to their own library: tables `saved_prompts` + `collections` (owner-scoped RLS),
served by `/api/saved-prompts` and `/api/collections`. This is private storage,
not a marketplace listing.

### 2. Courses (PromptPay SLIP only)
Course catalog + purchase + learning:
- Pages: `course-detail.html`, `course-buy.html`, `course-learn.html`,
  admin `admin-courses.html`.
- APIs: `/api/courses`, `/api/course-orders`, `/api/enrollments`,
  `/api/lessons`, `/api/skills`.
- Payment: **PromptPay QR + uploaded slip only** (credit wallet removed).
  Slips are verified via `lib/slip2go.js`; see `test-slip.html` / `/api/test-slip.js`.

### 3. GAS Builder — "สั่งสร้างระบบ"
Customers order a custom Google Apps Script system:
- Pages: `gas-builder.html`, `gas-builder-success.html`.
- APIs: `/api/gas-orders`, `/api/gas-templates`, `/api/gas-codegen`.
- Helpers: `lib/gas-codegen.js`, `lib/gas-zip-builder.js`.
- Data: `gas_orders` (renamed from `codegen_orders`), `gas_templates`,
  `gas_specs`, `customer_projects`, `customer_oauth_tokens`
  (see migrations `_02`..`_04`). Mode A / Mode B delivery; orders may pay via
  PromptPay slip or be delivered LINE-first.
- LINE integration: `lib/line.js` + `/api/line`.

---

## Shared pages & infrastructure

| Page | Purpose |
|------|---------|
| `/` (`index.html`) | Prompt Creator (landing) |
| `auth.html` | Login / Register |
| `account.html` | Account settings + change password |
| `admin.html` | Admin panel (users, courses, GAS orders, settings) |

Cross-cutting:
- `css/marketplace.css` — **site-wide shared stylesheet** (auth links, user
  menu, toast). Kept and linked everywhere; do not remove despite the name.
- `lib/auth.js` — JWT verification middleware for serverless functions.
- `lib/notify.js` — in-app notifications helper.
- `lib/helpers.js` — shared utilities.

---

## Backend scaffolding (Vercel + Supabase)

- `package.json` — deps: `@supabase/supabase-js`, `dotenv`.
- `api/` — Vercel Serverless Functions (Node.js).
- `vercel.json` — routes + env config.
- `lib/supabase.js` — Supabase client helper (anon + service-role clients).

### Environment variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
```
(PromptPay slip verification and LINE add their own keys — see
`lib/slip2go.js` / `lib/line.js`.)

---

## Database

Tech: Supabase PostgreSQL + Auth (email + password) + Storage.

- **Source of truth:** the dated migrations in `supabase/migrations/`.
  - `create_pending_topups.sql`, `migrate_truemoney_to_promptpay.sql` — early.
  - `20260525_01_drop_marketplace.sql` — marketplace-removal migration.
  - `20260525_02_extend_codegen_to_gas.sql` — `codegen_orders` → `gas_orders`.
  - `20260525_03_add_gas_builder_tables.sql` — GAS Builder tables.
  - `20260525_04_update_notifications_and_seed.sql` — notif enum + seeds.
  - `20260525_05_harden_functions.sql` — function hardening (advisor fixes).
  - `20260525_06_fix_advisors_indexes_and_policies.sql` — FK indexes + RLS
    consolidation.
- `supabase/schema.sql` — HISTORICAL pre-pivot schema, kept for reference only.
  **Do not re-run it.** Apply new changes via NEW dated migrations.
- Storage buckets in use: `avatars` (public), `codegen` (private, GAS ZIPs +
  slips). The old `prompt-files` / `prompt-images` buckets were dropped.

All tables use Row Level Security; mutations that touch core data go through
`SECURITY DEFINER` RPCs.
