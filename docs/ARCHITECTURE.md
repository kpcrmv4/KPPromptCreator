# Architecture — KP GAS Builder

> System architecture สำหรับ shop UI + 4 delivery paths + per-customer deployed system
> อ่านคู่กับ `BUSINESS-MODEL.md` (pricing), `SCHEMA-CHANGES.md` (DB), `SHOP-FLOW.md` (UX)
> Last updated: 2026-05-25 (v2 — Mode A/B + LINE-first + OAuth deploy)

---

## 1. High-level System Map

```
┌─────────────────────────────────────────────────────────────────┐
│   kp-shop (codebase นี้ · 1 Vercel project)                     │
│   kpgas.app                                                     │
│                                                                 │
│   ─ Landing + Prompt Creator (เดิม) + GAS upsell hook          │
│   ─ GAS Shop wizard (new)                                      │
│       · Template catalog                                        │
│       · Style/brand picker                                      │
│       · Add-on picker (force Mode B detection)                  │
│       · AI chat (requirement gathering)                         │
│       · Delivery method choice (Step 4.5)                       │
│       · Submit → LINE OA QR + prefilled message                 │
│   ─ Customer dashboard (orders, projects, renewals)             │
│   ─ Admin panel                                                 │
│       · Order queue (filter by status)                          │
│       · Mark Paid (after LINE chat verify)                      │
│       · Spec viewer (prompt.md)                                 │
│       · Build trigger (4 paths — see §3)                        │
│       · Deploy trigger                                          │
│   ─ Courses (เดิม — ไม่แตะ)                                     │
│                                                                 │
│   Stack: HTML/JS + Vercel functions + Supabase                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Order submitted
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│   LINE OA (@kpgas)                                              │
│   ─ ลูกค้า Add Friend จาก success page                          │
│   ─ ส่ง prefilled message พร้อม ORDER-XXXX                     │
│   ─ Admin คุยรายละเอียด + ส่ง PromptPay QR                      │
│   ─ ลูกค้าส่งสลิป → admin verify → mark paid                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Status='paid' → admin starts build
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│   Build Pipeline (semi-manual)                                  │
│   → ดู §3 — 4 paths ต่างกันตาม delivery_method                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Deployed
                              ▼
       ┌──────────────────────┴──────────────────────┐
       ▼                                             ▼
┌──────────────────────────┐              ┌──────────────────────────┐
│ Mode A — Pure GAS        │              │ Mode B — Hybrid          │
│ ─ GAS Web App ใน Drive   │              │ ─ Frontend = Vercel      │
│   ลูกค้า                  │              │   (ของเรา)                │
│ ─ HTMLService UI         │              │ ─ Backend = GAS+Sheet     │
│ ─ ค่ารายปี ฿0             │              │   ใน Drive ลูกค้า         │
│ ─ ลูกค้าเป็นเจ้าของ 100%   │              │ ─ ฿300/ปี hosting        │
└──────────────────────────┘              └──────────────────────────┘
       │                                             │
       └──────────────────────┬──────────────────────┘
                              ▼
                  ┌──────────────────────┐
                  │ Customer's Google     │
                  │ Sheet (data store)    │
                  └──────────────────────┘
```

---

## 2. Component Responsibilities

### 2.1 kp-shop (this codebase)

**Existing — keep & extend:**
- `index.html` — landing + prompt creator (เดิม) + เพิ่ม GAS Builder CTA
- `js/app.js`, `js/save-prompt.js`, `js/gas-mode.js` — prompt creator (เดิม)
- `account.html`, `auth.html`, `dashboard.html` — auth & profile
- `course-*.html`, `lessons/`, `enrollments` — course system (เดิม)
- `topup.html`, `orders.html` — เปลี่ยน purpose: GAS orders แทน prompt orders
- `admin.html` — admin (ปรับเมนู)
- `api/auth/*`, `api/credits/*`, `api/topup/*` — เก็บไว้
- `api/codegen-orders/*` — extend เป็น GAS shop orders
- `api/gas-codegen/*` — เก็บ + ขยาย

**New (build):**
- `gas-builder.html` — wizard 5+1 steps
- `gas-builder-success.html` — LINE OA contact page (post-submit)
- `js/gas-builder.js` — wizard logic, AI chat, pricing engine, Mode A/B detect
- `customer-projects.html` — ลูกค้า view ระบบของตัวเอง
- `admin-gas-orders.html` — admin queue + mark paid + build/deploy

**APIs:**
- `api/gas-templates/index.js` — list templates
- `api/gas-templates/[code].js` — template detail + preview
- `api/gas-orders/index.js` — POST (submit), GET (list mine)
- `api/gas-orders/quote.js` — POST: คำนวณราคา + force Mode B detect
- `api/gas-orders/[id]/chat.js` — POST: AI conversation
- `api/gas-orders/[id]/spec.js` — POST: generate prompt.md
- `api/admin/gas-orders/queue.js`
- `api/admin/gas-orders/[id]/mark-paid.js` — manual mark after LINE verify
- `api/admin/gas-orders/[id]/start-build.js` — 4 paths (see §3)
- `api/admin/gas-orders/[id]/deploy.js` — Mode A/B specific
- `api/admin/gas-orders/[id]/oauth-link.js` — generate OAuth URL ให้ส่งลูกค้า (Done-For-You path)
- `api/oauth/callback.js` — รับ token จากลูกค้า → store ชั่วคราว → trigger deploy
- `api/customer-projects/index.js`
- `api/customer-projects/[id]/oauth-link.js` — สำหรับ update ในอนาคต

**Removed:**
- `marketplace.html` + `prompt-detail.html`
- `api/prompts/*`, `api/reviews/*`, `api/orders/*` (เก่า — marketplace)
- ระบบ slip upload UI + PromptPay QR generator ในเว็บ (ย้ายไป LINE)

### 2.2 Build Pipeline (admin-only)

ดู §3 — มี 4 paths ตาม `delivery_method`:

| delivery_method | Description |
|---|---|
| `mode-a-diy` | Admin generate zip + ส่งให้ลูกค้าทาง LINE |
| `mode-a-done-for-you` | Admin trigger OAuth link → ลูกค้าคลิก → backend deploy auto |
| `mode-b-self-setup` | Admin code + push → Vercel auto-deploy + รอลูกค้าส่ง Google Cloud key |
| `mode-b-setup-service` | Admin code + push + screen share พาลูกค้าตั้ง Google Cloud |

### 2.3 LINE OA Integration

Hybrid: ใช้ LINE OA ของเราเองสำหรับ customer contact + order tracking

| Component | Method |
|---|---|
| Add friend QR ที่ success page | LINE OA basic ID → QR generator |
| Prefilled message link | `https://line.me/R/oaMessage/{OA_ID}/?{message}` |
| Admin notification เมื่อ order ใหม่ | LINE Notify (ลูกค้าใช้ไม่ได้ แต่เราใช้ภายในได้จนตาย — แล้วย้ายเป็น LINE Push) |
| Deliver URL ให้ลูกค้า | LINE Push (Messaging API) ผ่าน LINE OA |
| Renewal reminder | LINE Push schedule |

**LINE OA setup:**
- ใช้ LINE Premium ID (`@kpgas`) — ฿2,200/ปี ดูเป็นมืออาชีพ
- Messaging API enabled (200 ข้อความฟรี/เดือน ปกติพอ — ถ้าโต จ่าย ฿1,500/เดือน 5,000 ข้อความ)
- Rich menu ด้านล่าง: [สถานะออเดอร์] [คู่มือ] [ติดต่อ admin] [โปรโมชั่น]

### 2.4 Customer Frontend (per project)

#### Mode A: GAS Web App
- เปิดที่ `https://script.google.com/macros/s/{deployment-id}/exec`
- UI: HTMLService template + Bootstrap/Tailwind CDN
- ลูกค้าเป็นเจ้าของ — เปิด apps.script.google.com → แก้ได้

#### Mode B: Next.js / Vanilla on Vercel
- แยก repo: `kpgas/cust-{slug}` (private)
- Stack: vanilla HTML/JS (Starter), Next.js (Standard/Pro ถ้ามี SPA/PWA)
- Auth ตาม spec
- Backend calls: `fetch(GAS_WEB_APP_URL + '?action=...')`

### 2.5 GAS Backend (per project)

| Aspect | Mode A | Mode B |
|---|---|---|
| ตำแหน่ง | Drive ลูกค้า | Drive ลูกค้า |
| Type | Standalone หรือ bound | Standalone |
| Deploy mode | Web App (Execute as: User accessing) | Web App (Execute as: Me — owner) |
| Access | Anyone with Google account | Anyone with link (front จะ verify auth) |
| Sheet access | Auto (เพราะ executor = owner ของ sheet) | OAuth client → service account หรือ user token |

---

## 3. Build & Deploy Flow — 4 Paths

### 3.1 Path A1 — Mode A · DIY

```
[Admin in admin-gas-orders.html]
  ├─ Click order → see spec.md + add-on list
  ├─ Click "Generate ZIP"
  │     POST /api/admin/gas-orders/{id}/start-build
  │     server:
  │       1. clone template repo locally
  │       2. apply spec.md → render files
  │       3. zip → upload to Supabase storage
  │       4. update order.status = 'in_production'
  │       5. send LINE message to customer:
  │          "พร้อมแล้ว → [ดาวน์โหลด ZIP] + คู่มือ video"
  │
  └─ ลูกค้าทำเอง: copy code → deploy → ตอบกลับใน LINE
     "เสร็จแล้วครับ URL: ..."
     
[Admin]
  ├─ Click "Mark Delivered" → input URL ลูกค้าให้มา
  │     POST /api/admin/gas-orders/{id}/mark-delivered
  │     server:
  │       1. insert customer_projects (vercel_url = null, gas_web_app_url = ...)
  │       2. status = 'delivered'
```

### 3.2 Path A2 — Mode A · Done-For-You (OAuth deploy)

```
[Admin]
  ├─ Click "Start Build"
  │     POST /api/admin/gas-orders/{id}/start-build
  │     server:
  │       1. clone template + apply spec → ได้ Code.gs + appsscript.json
  │       2. save to `gas_orders.generated_code` (jsonb of files)
  │       3. generate OAuth URL:
  │          https://kpgas.app/oauth/install?order={id}&token={signed_jwt}
  │       4. send LINE message:
  │          "พร้อม install → คลิก link นี้เพื่อ authorize"
  │       5. update status = 'awaiting_oauth'
  │
[Customer คลิก link]
  ├─ Browser → Google OAuth consent screen
  ├─ User grant: drive.file + script.projects + script.deployments
  ├─ Callback → /api/oauth/callback?code=...&state={order_id}
  │     server:
  │       1. exchange code → refresh + access token
  │       2. store ใน customer_oauth_tokens (TTL 24h)
  │       3. enqueue deploy job
  │       4. show success page: "เริ่มติดตั้งแล้ว เราจะแจ้งใน LINE เมื่อเสร็จ"
  │
[Deploy worker]
  ├─ Read customer_oauth_tokens for order
  ├─ Apps Script API call:
  │     1. POST /v1/projects {title: project_name, parentId: optional}
  │        → script_id
  │     2. PUT /v1/projects/{id}/content {files: [...]}
  │     3. POST /v1/projects/{id}/versions {description}
  │        → version_number
  │     4. POST /v1/projects/{id}/deployments {
  │          versionNumber, manifestFileName: 'appsscript',
  │          deploymentConfig: { description, manifestFileName }
  │        }
  │        → deployment_id + web_app_url
  │  
  ├─ Update customer_projects (gas_script_id, gas_web_app_url)
  ├─ DELETE customer_oauth_tokens (revoke + cleanup)
  ├─ Update order.status = 'delivered'
  ├─ Send LINE: "ระบบพร้อมใช้งาน → {url}"
```

### 3.3 Path B1 — Mode B · Self-setup

```
[Admin]
  ├─ Click "Start Build"
  │     POST /api/admin/gas-orders/{id}/start-build
  │     server:
  │       1. gh repo create kpgas/cust-{slug} --template tpl-{type} --private
  │       2. git clone to /workspace/{slug}
  │       3. write prompt.md (จาก gas_specs.content_md)
  │       4. open Cursor URI cursor://file/{workspace}/{slug}
  │       5. status = 'in_production'
  │
  ├─ [Admin codes + tests in Cursor/Claude Code 1-3 ชม.]
  ├─ git push → Vercel auto-deploy
  │
[Customer]
  ├─ Admin ส่ง LINE: "ตั้ง Google Cloud ตามคู่มือนี้ → {link}"
  ├─ ทำเอง 30-60 นาที
  ├─ ส่ง keys กลับใน LINE: client_id, client_secret
  │
[Admin]
  ├─ Click "Add Credentials" → ใส่ keys
  │     POST /api/admin/gas-orders/{id}/credentials
  │     server: encrypt + store, update env vars ใน Vercel
  │
  ├─ Click "Deploy"
  │     POST /api/admin/gas-orders/{id}/deploy
  │     server (sequential):
  │       1. Apps Script API: create GAS + push + deploy (ใช้ service account ของเรา)
  │          → gas_web_app_url
  │       2. Update Vercel env: GAS_WEB_APP_URL
  │       3. Trigger Vercel redeploy
  │       4. Insert customer_projects
  │       5. status = 'delivered'
  │       6. Send LINE: "ระบบพร้อม → {vercel_url}"
```

### 3.4 Path B2 — Mode B · Setup Service

เหมือน B1 แต่:
- Admin นัด screen share 45 นาที กับลูกค้า
- ทำ Google Cloud Console พร้อมลูกค้า
- ได้ keys → ใส่ตรง admin panel
- เร็วกว่า B1 (ลูกค้าไม่หายไป 3-7 วัน)

---

## 4. Data Flow

### 4.1 Order Submit Flow (LINE-first — ไม่มี checkout บนเว็บ)

```
Customer ใน gas-builder.html
  ├─ เลือก template
  ├─ เลือก style
  ├─ เลือก add-ons (toggle ละตัว → ราคา update real-time + Mode detect)
  ├─ AI chat → spec_json
  ├─ Preview + Quote
  ├─ Step 4.5: เลือก delivery_method
  ├─ Step 5: กรอกชื่อ + email + line_id (option)
  │
  ├─ Click "ยืนยันคำสั่งซื้อ"
  │     POST /api/gas-orders
  │     body: { template_code, mode, delivery_method, addons[], style,
  │             spec_json, chat_log, total, contact: {name, email, line_id} }
  │
  └─ Backend:
        ├─ Insert gas_orders (status='submitted', order_number='ORDER-{6hex}')
        ├─ Insert gas_specs (version=1, content_md, spec_json)
        ├─ Send admin notification (LINE Push ไป admin's LINE):
        │     "New order ORDER-XXXX · ฿{total} · {template_name}"
        ├─ Return order_id + order_number + line_oa_qr_url + line_message_url
        │
        ├─ Frontend redirect → gas-builder-success.html?order={order_id}
        │   แสดง:
        │     - ORDER-XXXX (copyable)
        │     - LINE OA QR
        │     - "Add LINE" button → URL scheme
        │     - Prefilled message
```

### 4.2 Payment Verification Flow (เกิดใน LINE)

```
[Customer] Add LINE OA + send prefilled message
                ↓
[LINE Admin tool / chatbot]:
  ├─ ตอบ welcome + ยืนยัน order info จาก order_number
  ├─ ส่ง PromptPay QR + ยอด
  ↓
[Customer] โอนเงิน + ส่งสลิป
                ↓
[Admin] เห็นสลิปใน LINE → manual verify ยอด
                ↓
[Admin] เปิด admin-gas-orders.html → find ORDER-XXXX
                ↓
[Admin] คลิก "Mark Paid"
        POST /api/admin/gas-orders/{id}/mark-paid
        body: { slip_note?: "ตรงยอด ฿1,799 เวลา 13:45" }
        server:
          - update status = 'paid'
          - update paid_at = NOW()
          - insert transactions (type='gas_payment', amount, ref=order_id)
          - LINE Push to customer: "ยืนยันการชำระเงินแล้ว → เริ่มสร้างระบบใน 30 นาที"
          - status auto → 'in_queue'
```

### 4.3 Renewal Flow (Mode B เท่านั้น)

```
Cron job ทุกวัน 09:00:
  ├─ Find customer_projects WHERE
  │     mode = 'B' AND status='live' AND expires_at IN reminder windows
  │
  ├─ Send LINE Push:
  │     -30 days: "ครบ 30 วันก่อนหมดอายุ → ต่ออายุ ฿300/ปี"
  │     -7, -1, 0, +7, +14, +29 (escalating)
  │
  ├─ Find expires_at < NOW + status='live'
  │     → status = 'expired'
  │     → Vercel API: pause project (deploy maintenance page)
  │
  └─ Find expires_at < NOW - 90 days + status='expired'
        → status = 'archived'
        → Vercel: delete project
        → GitHub: archive repo
```

---

## 5. AI Chat Flow

`POST /api/gas-orders/{draftId}/chat`

**Prompt template:**
```
SYSTEM:
You are a requirement gathering assistant for KP GAS Builder.
Customer has selected: template={template_code}, mode={A|B}, addons=[...]
Your job:
1. Ask 1 question at a time in Thai (สั้น กระชับ)
2. Cover (in order):
   a. Sheet schema (columns)
   b. Workflows (trigger → action)
   c. Edge cases
   d. Integration credentials they have/don't have
3. After 5-8 turns OR enough info → output JSON spec in ```json``` block

Tone: friendly, practical, no jargon.
If user unclear → give 2-3 example options.
If user asks technical Q → answer briefly + redirect.
```

Conversation stored ใน `gas_orders.chat_log` (JSONB array)

---

## 6. Spec (prompt.md) Generation

`POST /api/gas-orders/{id}/spec` → render template

```markdown
# Project: {project_name}
# Customer: {customer_name}
# Order: ORDER-{XXXX}
# Mode: {A | B}
# Delivery: {delivery_method}
# Tier: {tier} · Budget: ฿{price}

## Template
{template_code} — {template_name}

## Sheet Schema
{rendered from spec_json.sheet_schema}

## Add-ons enabled
{checklist}

## Workflows
{rendered from spec_json.workflows}

## Style
- theme: {style.theme}
- font: {style.font}
- dark_mode: {style.dark_mode}

## Custom rules (จาก AI chat)
{spec_json.custom_rules}

## Integration credentials (กรอกตอน deploy)
{rendered placeholders}

## Build constraints
- Mode {A}: ไม่ใช้ Vercel · UI = HTMLService · auth = built-in Google
- Mode {B}: frontend = Next.js on Vercel · backend = GAS web app
```

---

## 7. Template Monorepo Structure

แยกเป็น repo `kpgas/templates` (อยู่นอก codebase นี้):

```
templates/
├── crm-basic/
│   ├── mode-a/                      # Pure GAS implementation
│   │   ├── appsscript.json
│   │   ├── Code.gs
│   │   ├── Index.html              # HTMLService template
│   │   ├── Stylesheet.html
│   │   ├── JavaScript.html
│   │   └── README.md
│   ├── mode-b/                      # Hybrid
│   │   ├── frontend/                # Vercel-deployable
│   │   │   ├── index.html
│   │   │   ├── app.js
│   │   │   └── vercel.json
│   │   └── backend/                 # GAS code
│   │       ├── appsscript.json
│   │       └── Code.gs
│   ├── spec-schema.json
│   └── preview/
│       ├── mode-a-preview.html
│       └── mode-b-preview.html
├── inventory/
└── _shared/
    ├── ui-mode-a/                   # HTMLService components
    └── ui-mode-b/                   # Vercel components
```

GitHub template feature → `gh repo create --template=kpgas/templates/crm-basic/mode-b`

---

## 8. Security & RLS

| Concern | Mitigation |
|---|---|
| Customer A เห็น order B | RLS บน `gas_orders` — `user_id = auth.uid()` |
| OAuth token รั่วจาก customer_oauth_tokens | encrypt ด้วย pgsodium · TTL 24h · auto-delete หลัง deploy |
| GAS script_id ลูกค้ารั่ว | RLS owner + admin only |
| Vercel/GitHub API token รั่ว | server-only `.env` · ห้าม NEXT_PUBLIC_* |
| LINE webhook signature | verify `x-line-signature` header ทุก inbound |
| Order number guessable | 6-hex random (16M possibilities) + ต้อง auth ดู detail |

---

## 9. Environment Variables (เพิ่มจากที่มี)

```bash
# ─────── เดิม ───────
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
ANTHROPIC_API_KEY=
PROMPTPAY_NUMBER=
SLIP2GO_API_URL=
SLIP2GO_SECRET=

# ─────── ใหม่ ───────

# Vercel API (สำหรับ auto-deploy Mode B)
VERCEL_TOKEN=
VERCEL_TEAM_ID=

# GitHub (สำหรับ create template repo)
GITHUB_TOKEN=
GITHUB_TEMPLATE_ORG=kpgas

# Google OAuth (สำหรับ Done-For-You deploy + customer Sheet access)
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
GOOGLE_OAUTH_REDIRECT_URI=https://kpgas.app/api/oauth/callback

# Google Service Account (สำหรับ Apps Script API + Mode B GAS deploy)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SERVICE_ACCOUNT_KEY=          # JSON key base64

# LINE OA (Messaging API)
LINE_OA_BASIC_ID=@kpgas              # หรือ premium ID
LINE_CHANNEL_ID=
LINE_CHANNEL_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=           # long-lived
LINE_WEBHOOK_SECRET=                 # สำหรับ verify signature

# Admin LINE user ID (สำหรับ push notification ตอนมี order)
ADMIN_LINE_USER_IDS=Uxxx,Uyyy

# Local workspace (admin machine — สำหรับ build)
GAS_BUILD_WORKSPACE=F:/kpgas-workspace
CURSOR_PATH=C:/Users/Administrator/AppData/Local/Programs/cursor/Cursor.exe
```

---

## 10. OAuth Consent Screen Verification

**บังคับทำก่อนเปิดบริการ Done-For-You** (Path A2)

เพราะใช้ sensitive scope: `drive.file`, `script.projects`, `script.deployments`

**ขั้นตอน:**
1. Google Cloud Console → APIs & Services → OAuth consent screen
2. Configure:
   - App name: KP GAS Builder
   - User support email: support@kpgas.app
   - App logo
   - App home page + privacy policy + TOS URL
   - Authorized domains: kpgas.app
   - Scopes ที่ขอ + justification
3. Submit for verification
4. Google review 7-14 วัน (อาจขอ demo video + audit)
5. หลัง verify → ไม่แสดง "Unverified app" warning อีก

**ระหว่างรอ verify:**
- ใช้ test mode (limit 100 users) — ทำ trial customer ได้
- หรือเริ่มด้วย Mode A1 (DIY) + Mode B ก่อน → เปิด Done-For-You หลัง verify

---

## 11. Out of Scope (Phase 1)

ไม่ทำใน Phase 1:

- ❌ Full auto-AI code generation (semi-manual ไปก่อน)
- ❌ Real-time preview ตอน AI chat (static preview ก่อน)
- ❌ Customer self-service edit ของระบบที่ deliver แล้ว
- ❌ Customer's own Vercel/GitHub (Phase 2)
- ❌ Subscription auto-billing (manual LINE reminder)
- ❌ LINE chatbot อัตโนมัติ (Phase 2 — ใช้คนตอบก่อน)
- ❌ A/B testing templates
- ❌ Multi-region deployments
