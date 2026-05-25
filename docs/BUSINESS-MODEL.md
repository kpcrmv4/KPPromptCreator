# Business Model — KP GAS Builder Service

> เอกสารกำหนดราคา, รูปแบบรายได้, scope ที่ครอบคลุม
> Source of truth สำหรับ pricing engine ในหน้าสั่งสร้าง
> Last updated: 2026-05-25 (v2 — เพิ่ม Mode A/B + LINE-first contact)

---

## 1. Value Proposition

> **"สั่งระบบ Google Apps Script ได้เหมือนสั่งของออนไลน์ — ไม่ต้อง deploy เอง ลูกค้าใช้งานได้ทันที"**

ลูกค้าเป้าหมาย: ธุรกิจเล็ก/ฟรีแลนซ์/ทีมในไทย ที่ต้องการระบบจัดการข้อมูลบน Google Sheets แต่ไม่มี dev ของตัวเอง และไม่อยากจ้าง dev เต็มเวลา (งบ ฿100-3,000)

---

## 2. Delivery Modes (สำคัญ — ต่างราคา + ต่างประสบการณ์)

ลูกค้าได้ระบบใน 1 ใน 2 mode — auto-detect จาก add-on ที่เลือก

### 2.1 Mode A — Pure GAS

| | |
|---|---|
| **ตำแหน่งไฟล์** | Google Apps Script + Sheet ใน Drive ลูกค้า |
| **Frontend** | HTMLService ของ Google (UI พื้นฐาน) |
| **Hosting** | Google ฟรีตลอดชีพ |
| **ค่ารายปี** | ❌ ไม่มี (one-time, lifetime) |
| **Ownership** | ลูกค้า 100% |
| **เริ่มต้น** | **฿499** (floor — ทุก template/delivery method) |
| **เหมาะกับ** | Internal team tool, CRUD พื้นฐาน, รายงาน, จองคิว, สต็อก |
| **ทำไม่ได้** | กล้อง, barcode scan, PWA, SPA, login ผ่าน OAuth ภายนอก, AI feature, Maps |

### 2.2 Mode B — Hybrid Vercel + GAS

| | |
|---|---|
| **ตำแหน่งไฟล์** | Frontend = Vercel (ของเรา) + Backend = GAS+Sheet (ของลูกค้า) |
| **Frontend** | Next.js / vanilla web — modern UI |
| **Hosting** | Vercel (เราจ่าย) + Google (ลูกค้า) |
| **ค่ารายปี** | ฿300/ปี (เริ่มปีที่ 2) |
| **Ownership** | Vercel project = เรา / GAS+Sheet = ลูกค้า |
| **เริ่มต้น** | **฿499** (floor — ทุก template/delivery method) |
| **เหมาะกับ** | Customer-facing, modern UX, ฟีเจอร์ที่ HTMLService ทำไม่ได้ |
| **ต้อง setup เพิ่ม** | Google Cloud Console (หรือ +setup service ฿1,200) |

### 2.3 Auto-detect Rule

**Force Mode B ถ้ามี add-on ใดต่อไปนี้:**
- `camera-capture` / `barcode-scan` (Google บล็อกใน HTMLService)
- `pwa` / `spa`
- `google-oauth` / `line-login` / `phone-otp` (ต้อง redirect)
- `ai-chat` / `ai-search` / `ai-summary` / `ai-ocr` (modern UI)
- `multi-lang`
- `view-map` (Google Maps SDK)
- `permission-row` (ซับซ้อนเกินกว่า GAS)

**Mode A ใช้ได้ถ้าเลือกแค่:**
- Base template + basic field
- LINE Push / LINE Bot (push API server-to-server)
- Telegram bot
- Email send
- Calendar / Kanban view (HTMLService rendered)
- PDF / Excel export
- Approval workflow
- Audit log
- Charts / Dashboard

### 2.4 Mode Upgrade Warning ใน Shop

เมื่อลูกค้า toggle add-on ที่ force Mode B → แสดง confirmation modal:

```
⚠️ ฟีเจอร์ "{addon}" ต้องใช้ Mode Hybrid
─ ราคา ฿499 → ฿1,799
─ + ค่ารายปี ฿300
─ + ตั้งค่า Google Cloud (หรือเพิ่ม Setup Service)

[ยกเลิก feature]   [ยอมรับและไป Mode B]
```

---

## 3. Revenue Streams

### 3.1 Build Fee (one-time)

**Floor price ทุก template = ฿499** (Mode A และ Mode B ราคาเท่ากัน)
Tier กำหนดอัตโนมัติจาก ยอดรวม (template + add-ons)

| Tier | ยอดรวม | Scope | เวลาผลิต (เป้าหมาย) |
|---|---|---|---|
| **Starter** | ฿499-799 | Template + brand | 30 นาที |
| **Standard** | ฿800-1,500 | + custom field/view + integration | 1-2 ชม. |
| **Pro** | ฿1,501-3,000 | + custom logic / approval / AI | 2-4 ชม. |

> ลูกค้าไม่ต้องเข้าใจ tier เอง — ระบบ assign ให้อัตโนมัติ
> Mode A vs Mode B = ราคา build เท่ากัน แต่ Mode B มีค่ารายปี ฿300 ตั้งแต่ปีที่ 2

### 3.2 Hosting & Maintenance (recurring)

| Mode | Year 1 | Year 2+ |
|---|---|---|
| **Mode A** | ฟรี (รวมใน build) | ❌ ไม่มีค่ารายปี — ตลอดชีพ |
| **Mode B** | ฟรี (รวมใน build) | ฿300/ปี |
| **Custom domain (Mode B add-on)** | ฿300 ปีแรก | ฿300/ปี |

### 3.3 Delivery Method (เลือกได้ระหว่าง wizard — ราคาเท่ากัน)

#### สำหรับ Mode A:

| Code | บริการ | ราคา | สิ่งที่ลูกค้าทำ | สิ่งที่เราทำ |
|---|---|---|---|---|
| `mode-a-diy` | Self-deploy | **เท่ากัน** | copy/paste + deploy เอง (10-15 นาที) | ส่งโค้ด + video tutorial |
| `mode-a-done-for-you` (default) | Done-For-You | **เท่ากัน** | คลิก OAuth 1 ครั้ง (< 1 นาที) | ใช้ Apps Script API deploy ให้ |

> Delivery method = ความสะดวก ไม่ใช่ราคา — ลูกค้าเลือกตามความถนัด

#### สำหรับ Mode B:

| Code | บริการ | ราคา | สิ่งที่ลูกค้าทำ | สิ่งที่เราทำ |
|---|---|---|---|---|
| `mode-b-self-setup` (default) | ตั้งเอง | **ฟรี (รวมในราคา)** | ทำตามคู่มือ 30-60 นาที | ส่งคู่มือทีละ step |
| `mode-b-setup-service` | Setup Service | **+฿1,200** | screen share 45 นาที | นั่งพาทำทุก step |

### 3.4 Optional Add-ons (Done-For-You + Training)

| Code | ชื่อ | ราคา | หมายเหตุ |
|---|---|---|---|
| `training-30min` | Screen share training 30 นาที | +฿300 | สอน update / แก้ code / เพิ่ม feature เอง |
| `tenant-account` | Tenant account fallback | +฿200/ปี | เคสที่ลูกค้าไม่ยอม OAuth — เราเก็บไว้ในบัญชี dedicated |

### 3.5 Setup Services (สำหรับ integration ที่ลูกค้าทำเองยาก)

| Code | บริการ | ราคา | ครอบคลุม |
|---|---|---|---|
| `setup-line` | LINE OA + Messaging API | +฿800 | screen share 30 นาที |
| `setup-google` | Google Cloud Project + OAuth + APIs | +฿1,200 | screen share 45 นาที |
| `setup-domain` | จดโดเมน + DNS + Vercel link | +฿500 | ทำให้ (ลูกค้าจ่ายค่าโดเมน) |
| `setup-ai` | Anthropic/OpenAI + billing + key | +฿400 | screen share 20 นาที |
| `setup-email` | SendGrid/Resend + domain verify | +฿500 | ทำให้ + ตั้ง DNS |
| `setup-sms` | ThaiBulkSMS + เติมเงิน + key | +฿400 | screen share |
| `setup-slip2go` | Slip2Go account | +฿400 | screen share |

### 3.6 Bundles

| Bundle | รวมอะไร | ราคา | ลด |
|---|---|---|---|
| **Essential Setup** | LINE + Google Cloud | ฿1,800 | -฿200 |
| **Pro Setup** | LINE + Google + Domain + AI | ฿2,500 | -฿400 |
| **🥇 Done-For-You** | ทุก setup service ที่ลูกค้าเลือก | **+30% ของ build fee** | scales กับขนาดงาน |

### 3.7 Future revenue (Phase 2+)

- **Source code transfer** — ฿1,500-3,000 (โอน repo ownership)
- **Migration to customer's Vercel** — ฿1,000 (เฉพาะ Mode B)
- **Premium support plan** — ฿800/ปี (response 1 วัน + 2 ชม. tweaks/เดือน)

---

## 4. Pricing Catalog (Single Source of Truth)

> Source of truth สำหรับ pricing engine ในหน้าสั่งสร้าง
> ทุกการเปลี่ยนแปลงราคา = update ที่นี่ก่อน แล้ว sync เข้า DB

### 4.1 Base Template (เลือก 1 — บังคับ)

**Floor ฿499 สำหรับทุก template ทุก mode**
Template ที่ scope ใหญ่ → base price สูงกว่า (สะท้อนเวลาผลิต)

| Code | ชื่อ | Use case | Base price | Mode |
|---|---|---|---|---|
| `crm-basic` | CRM พื้นฐาน | ลูกค้า/ดีล/ติดตาม | ฿499 | A หรือ B |
| `inventory` | สต็อกสินค้า | รับเข้า-เบิกออก | ฿499 | A หรือ B |
| `booking` | จองคิว/นัดหมาย | คลินิก, ร้านเสริมสวย | ฿499 | A หรือ B |
| `pos-simple` | POS บันทึกขาย | ร้านค้าเล็ก | ฿499 | A หรือ B |
| `form-dashboard` | Form + Dashboard | สำรวจ + สรุปผล | ฿499 | A หรือ B |
| `employee-checkin` | เช็คอินพนักงาน | GPS + รูป | ฿900 | B only (กล้อง) |
| `hr-leave` | HR ลา/OT | พนักงาน <50 คน | ฿800 | A หรือ B |
| `order-online` | Order online | รับออเดอร์ + ติดตาม | ฿800 | A หรือ B |
| `custom` | Custom (AI ออกแบบ) | ตามที่ลูกค้าเล่า | ฿1,500 | A หรือ B |

> Mode A และ Mode B ราคา build เท่ากัน — Mode B ต่างที่ค่ารายปี ฿300 ตั้งแต่ปีที่ 2

### 4.2 Architecture Add-ons

| Code | ชื่อ | Δ ราคา | Force Mode? | Dependency |
|---|---|---|---|---|
| `spa` | SPA (single-page, fast) | +฿100 | — | — |
| `pwa` | PWA + offline | +฿200 | → B | ต้องมี `spa` |
| `dark-mode` | Dark mode | +฿100 | — | — |
| `multi-lang` | Multi-language TH/EN | +฿200 | — | — |

### 4.3 Auth (เลือก 1 — ราคา uniform +฿300)

| Code | ชื่อ | Δ ราคา | Force Mode? | หมายเหตุ |
|---|---|---|---|---|
| `no-auth` | No login | +฿0 | — | Internal tool |
| `google-oauth` | Google OAuth | +฿300 | — | Mode A: built-in / Mode B: ต้อง Google Cloud |
| `line-login` | LINE Login | +฿300 | → B | + LINE Login Channel |
| `email-password` | Email/Password | +฿300 | → B | + verify + reset |

### 4.4 Role/Permission (single option)

| Code | ชื่อ | Δ ราคา | Force Mode? |
|---|---|---|---|
| `role-permission` | Role-based access (admin/user/custom, row-level) | +฿300 | — |

### 4.5 Integrations

⚠️ **LINE Notify ถูก deprecated** มี.ค. 2025 — ใช้ Messaging API แทน

| Code | ชื่อ | Δ ราคา | Force Mode? | Customer setup |
|---|---|---|---|---|
| `line-push` | LINE Push (Messaging API one-way) | +฿500 | — | LINE OA + Messaging Channel |
| `line-bot` | LINE Bot (Messaging API + webhook) | +฿1,000 | — | + Webhook URL |
| `telegram-bot` | Telegram Bot | +฿400 | — | @BotFather (ง่าย) |
| `email-send` | Email (SendGrid/Resend) | +฿400 | — | Account + DNS verify |
| `promptpay` | PromptPay QR (รับเงิน) | +฿500 | — | แค่บอกเบอร์ |
| `slip-verify` | Slip verify (Slip2Go) | +฿700 | — | Slip2Go account |
| `google-calendar` | Google Calendar sync | +฿500 | — | Mode A: CalendarApp built-in |
| `google-drive-upload` | Google Drive upload | +฿300 | — | (ใน GAS = built-in / Vercel = OAuth) |
| `google-maps` | Google Maps | +฿500 | → B | Google Cloud + บัตรเครดิต |

### 4.6 Features

| Code | ชื่อ | Δ ราคา | Force Mode? |
|---|---|---|---|
| `charts` | Charts / dashboard | +฿500 | — |
| `view-calendar` | Calendar view | +฿400 | — |
| `view-kanban` | Kanban view | +฿400 | — |
| `view-map` | Map view | +฿600 | → B |
| `file-upload` | File upload (Drive) | +฿400 | — |
| `image-gallery` | Image gallery | +฿300 | — |
| `camera-capture` | Camera capture | +฿500 | → B ⭐ |
| `barcode-scan` | Barcode/QR scan | +฿700 | → B ⭐ |
| `signature-pad` | Signature pad | +฿500 | — |
| `pdf-export` | PDF export/print | +฿500 | — |
| `excel-export` | Excel/CSV export | +฿300 | — |
| `csv-import` | CSV bulk import | +฿400 | — |
| `approval-workflow` | Approval workflow | +฿1,000 | — |
| `notification-center` | Notification center | +฿500 | — |
| `audit-log` | Activity log / audit | +฿500 | — |
| `gps-checkin` | GPS check-in | +฿500 | — |

⭐ = ตัวที่ Google บล็อกใน HTMLService — บังคับใช้ Vercel frontend

### 4.7 AI Features (premium — recurring cost)

| Code | ชื่อ | Δ ราคา (build) | Force Mode? | Recurring |
|---|---|---|---|---|
| `ai-chat` | AI chat assistant ในแอป | +฿1,500 | → B | API token (customer pay) |
| `ai-search` | AI semantic search | +฿1,000 | → B | Embedding cost (customer pay) |
| `ai-summary` | AI summary เอกสาร | +฿800 | → B | Per call (customer pay) |
| `ai-ocr` | OCR (อ่านบิล/สลิป) | +฿1,200 | → B | Per call (customer pay) |

> ลูกค้าต้องเอา API key ของตัวเอง — เราไม่ host token ให้

---

## 5. Tier Auto-detection Rule

| ยอดรวม | Tier | Build time (เป้าหมาย) |
|---|---|---|
| ฿499 - ฿799 | Starter | 30 นาที |
| ฿800 - ฿1,500 | Standard | 1-2 ชม. |
| ฿1,501+ | Pro | 2-4 ชม. |

---

## 6. Example Quotes

### 6.1 ร้านนวด — จองคิว (Mode A พอ)

```
booking template             ฿499
line-push                   +฿500
view-calendar               +฿400
charts                      +฿500
─────────────────────────────────
                            ฿1,899  (Standard · Mode A)
                            + ค่ารายปี ฿0  ← ตลอดชีพ
```

### 6.2 ทีมเซลล์ — CRM (Mode A · ขั้นต่ำสุด)

```
crm-basic                    ฿499
view-kanban                 +฿400
─────────────────────────────────
                              ฿899  (Standard · Mode A)
                            + ค่ารายปี ฿0
```

### 6.3 ลูกค้า floor-only — แค่ template เริ่มต้น

```
crm-basic                    ฿499
─────────────────────────────────
                              ฿499  (Starter · Mode A หรือ B)
                            + ค่ารายปี ฿0 (A) หรือ ฿300/ปี (B)
```

### 6.4 คลินิก — เช็คอินคนไข้ (Mode B — มีกล้อง)

```
employee-checkin (B-only)    ฿900
camera-capture              +฿500
gps-checkin                 +฿500
line-push                   +฿500
pdf-export                  +฿500
setup-line                  +฿800   ← ลูกค้ายังไม่มี LINE OA
─────────────────────────────────
                            ฿3,700  (Pro · Mode B)
                            + ค่ารายปี ฿300
```

### 6.5 ร้านขนม — Order online (Mode B — มี SPA + LINE Login)

```
order-online                 ฿800
spa                         +฿300
line-login                  +฿500
setup-line                  +฿800
promptpay                   +฿500
view-kanban                 +฿400
─────────────────────────────────
                            ฿3,300  (Pro · Mode B)
                            + ค่ารายปี ฿300
```

---

## 7. Payment Flow — LINE-First (ไม่มี checkout ในเว็บ)

### 7.1 ทำไมเลือก LINE-first

| เหตุผล | ผลที่ได้ |
|---|---|
| ลด friction ตอน checkout | ลูกค้าไม่ต้องอัปสลิป + กรอกข้อมูล + รอ verify บนเว็บ |
| Service custom = ต้องคุยอยู่แล้ว | ขยับการคุยมาก่อนชำระ ดีกว่าจ่ายก่อนแล้วงงทีหลัง |
| ลด abandoned cart | ลูกค้าลังเล/มีคำถาม → คุยได้ก่อน |
| ลด code ที่ต้องเขียน | ตัด slip upload + PromptPay QR + verify UI |
| คนไทยถนัด LINE | คุ้นกว่าเว็บ |

### 7.2 Flow

```
[Wizard เสร็จ] → Step 5 = "Submit + Contact LINE"
     ↓
[Click ยืนยันคำสั่งซื้อ]
     ↓
Backend:
  - Insert gas_orders (status='submitted')
  - Generate order_number (ORDER-{6 hex})
  - Generate prompt.md (spec)
  - Notify admin (LINE)
     ↓
Show success page:
  - แสดง ORDER-XXXX prominently
  - QR LINE OA + ปุ่ม "Add LINE"
  - Prefilled message พร้อม order number
     ↓
[ลูกค้า Add LINE OA] → ส่งข้อความ pre-filled
     ↓
[Admin ตอบใน LINE]:
  - ยืนยัน scope
  - ส่ง PromptPay QR + ยอด
  - ตอบคำถามเพิ่ม
     ↓
[ลูกค้าโอน + ส่งสลิปใน LINE]
     ↓
[Admin verify ใน LINE → กด "Mark Paid" ใน admin panel]
     ↓
status = 'paid' → 'in_queue' → 'in_production' → 'delivered'
```

### 7.3 LINE URL Scheme (สำหรับปุ่ม "Add LINE")

```javascript
const lineOaId = '@kpgas';  // หรือ basic ID
const message = encodeURIComponent(
  `สวัสดีครับ/ค่ะ\n` +
  `สั่งซื้อ ${orderNumber}\n` +
  `${template_name} · Mode ${mode} · ${deliveryMethod}\n` +
  `ยอด ฿${total}`
);
const url = `https://line.me/R/oaMessage/${lineOaId}/?${message}`;
```

ปุ่มเปิด → LINE app เปิดอัตโนมัติพร้อม message ใส่ให้แล้ว ลูกค้ากด send

---

## 8. Order Status Lifecycle

```
draft         — ยังไม่ submit (เก็บใน wizard ผ่าน autosave)
submitted     — submit แล้ว แสดง LINE OA QR
paid          — admin verify สลิปใน LINE → mark paid
in_queue      — รอ admin start build
in_production — admin คลิก start build
review        — internal QA
delivered     — ส่งมอบแล้ว (มี URL)
expired       — Mode B หมดอายุ hosting
archived      — เกิน grace period
rejected      — admin reject
refunded      — คืนเงิน
```

---

## 9. Non-renewal Policy (Mode B เท่านั้น — Mode A ไม่มีรายปี)

| ระยะเวลาหลังหมดอายุ | สถานะ | Action |
|---|---|---|
| 0-30 วัน | ใช้งานปกติ | LINE reminder วันที่ -30, -7, -1, 0, +7, +14, +29 |
| 31-90 วัน | Pause (แสดง "Service Expired") | LINE reminder รายสัปดาห์ |
| 90 วัน+ | Archive | ลบ Vercel project (GAS+Sheet ลูกค้ายังอยู่) |

ต่ออายุภายใน 90 วัน → restore ฟรี
ต่อหลัง 90 วัน → ฿200 restore fee

---

## 10. Refund Policy

| สถานะ | นโยบาย |
|---|---|
| submitted (ยังไม่จ่าย) | คืนเต็ม (ยกเลิก order ผ่าน LINE) |
| paid · ยังไม่ start build | คืนเต็ม |
| in_production | คืน 50% (เพราะมี spec + AI cost แล้ว) |
| delivered + ใช้งานไม่ได้ | คืนเต็ม + troubleshoot 7 วัน |
| delivered + ใช้งานได้ตรง spec | ไม่คืน |

---

## 11. Margin Estimation

**Fixed cost ต่อเดือน:**
- Vercel Pro: $20 = ฿700 (สำหรับ shop เว็บเดียว — Mode A ไม่ใช้)
- Supabase Pro: $25 = ฿875
- Domain (kpgas.app): ฿35/เดือน
- LINE OA: ฟรี (free tier 200 msg/เดือน) → Premium ฿2,200/ปี ถ้าโตขึ้น
- **รวม ≈ ฿1,610/เดือน** (ไม่นับ LINE Premium)

**Break-even:**
- avg order ฿1,000 → 2 order/เดือน คุ้มทุน
- avg order ฿500 → 4 order/เดือน
- avg order ฿2,000 → 1 order/เดือน

**Mode A vs B economics:**
- Mode A: ไม่กิน Vercel resource (อยู่ใน Google) → margin สูงกว่า แต่ราคาขายต่ำกว่า
- Mode B: กิน Vercel + recurring fee — แต่ราคาขายสูงกว่าและมี recurring revenue

**ลูกค้า renewal Mode B:** 6 คน/ปี = ฿1,800/ปี

---

## 12. Customer Decision Tree

```
ลูกค้าต้องการอะไร?
    ├─ ระบบใช้ภายในทีม, ไม่ต้องสวย ──────────→ Mode A · Self-deploy (เริ่ม ฿499)
    ├─ ระบบใช้ภายในทีม, ไม่อยากเสียเวลา deploy → Mode A · Done-For-You (default)
    ├─ ระบบลูกค้าใช้ภายนอก, ต้องการ UX ดี ──→ Mode B · ตั้ง Google Cloud เอง
    └─ ระบบลูกค้าใช้ภายนอก, ไม่อยากตั้งอะไรเลย → Mode B · + Setup Service
```
