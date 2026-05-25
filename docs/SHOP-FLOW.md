# Shop Flow — GAS Builder Wizard UX

> User journey + wireframe text + AI chat prompt structure + LINE-first checkout
> หน้า `gas-builder.html` + supporting screens
> Last updated: 2026-05-25 (v2 — Mode A/B + Step 4.5 + LINE success page)

---

## 1. Journey Overview

```
[1] Entry
     ├─ A. Direct: index.html → "สั่งสร้างระบบ GAS" CTA
     ├─ B. Upsell: prompt creator → modal → "สนใจให้เราสร้างให้?"
     └─ C. Cross-sell: dashboard → "สร้างระบบใหม่"
         ↓
[2] Template Picker            (Step 1/6)
         ↓
[3] Style + Brand              (Step 2/6)
         ↓
[4] Add-ons + AI Chat          (Step 3/6)
     ↓ (force Mode B warning ถ้าจำเป็น)
[5] Preview + Quote            (Step 4/6)
         ↓
[6] Delivery Method Choice     (Step 5/6)  ⭐ ใหม่
         ↓
[7] Submit + LINE Contact      (Step 6/6)  ⭐ เปลี่ยน flow
         ↓
[8] Add LINE OA + send prefilled message
         ↓
[9] Admin reply ใน LINE → ส่ง PromptPay QR → verify slip
         ↓
[10] Admin "Mark Paid" → LINE Push "เริ่มผลิต"
         ↓
[11] Build + Deploy (semi-manual)
         ↓
[12] LINE Push "ส่งมอบแล้ว → {URL}"
```

---

## 2. Step 1 — Template Picker

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  สั่งสร้างระบบ Google Apps Script                              │
│  Step ●○○○○○  เลือก template                                  │
├──────────────────────────────────────────────────────────────┤
│  ค้นหา: [_________________🔍]   หมวด: [ทั้งหมด ▾]            │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ [📊 รูป]    │ │ [📦 รูป]    │ │ [📅 รูป]    │            │
│  │ CRM พื้นฐาน  │ │ สต็อกสินค้า │ │ จองคิว      │            │
│  │ เริ่ม ฿499   │ │ เริ่ม ฿499   │ │ เริ่ม ฿499   │            │
│  │ [ดูตัวอย่าง] │ │ [ดูตัวอย่าง] │ │ [ดูตัวอย่าง] │            │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐            │
│  │ POS         │ │ Form        │ │ เช็คอิน     │            │
│  │ เริ่ม ฿499   │ │ เริ่ม ฿499   │ │ B-only ฿900│ ⚠️           │
│  └─────────────┘ └─────────────┘ └─────────────┘            │
│                                                              │
│  ─── หรือ ───                                                │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 🤖 Custom (AI ออกแบบ)                                   │ │
│  │ เริ่ม ฿1,500                                            │ │
│  │ [เริ่มคุยกับ AI →]                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ℹ️  Mode A = อยู่ใน Google ของคุณ ฟรีตลอดชีพ                │
│      Mode B = มี Vercel ของเรา (UI สวย + ฟีเจอร์ขั้นสูง)     │
│      [อ่านเพิ่ม]                                              │
│                                                              │
│                                          [ถัดไป →]           │
└──────────────────────────────────────────────────────────────┘
```

### Interactions
- คลิก card = เลือก template
- คลิก "ดูตัวอย่าง" = modal iframe (มี toggle Mode A vs Mode B ถ้ามีทั้งคู่)
- "B-only" badge แสดงเมื่อ template `forced_mode='B'`
- "ถัดไป" disabled จนเลือก template

### Data
- `GET /api/gas-templates?active=true`

---

## 3. Step 2 — Style + Brand

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Step ●●○○○○  ปรับแต่งสไตล์                                   │
├──────────────────────────────────────────────────────────────┤
│  ชื่อระบบ:  [_________________________________________]      │
│             (เช่น "ระบบจองคิวคลินิกแสงเดือน")                  │
│                                                              │
│  ธีมสี:                                                      │
│  ○ ●●● Minimal Blue                                         │
│  ○ ●●● Vibrant Coral                                        │
│  ○ ●●● Forest Green                                         │
│  ○ ●●● Classic Indigo                                       │
│  ○ ●●● Dark Pro                                             │
│                                                              │
│  Font:                                                       │
│  ○ Thai Modern (Sarabun / IBM Plex Thai)                    │
│  ○ Thai Classic (Sukhumvit / Kanit)                         │
│  ○ Friendly Round (Mali / Mitr)                             │
│                                                              │
│  Dark mode:                                                  │
│  [ ] เปิด dark mode ให้ลูกค้า toggle เองได้  (+฿200)         │
│                                                              │
│  Logo (option):                                              │
│  [📁 อัปโหลด] PNG/SVG · max 1MB                              │
│                                                              │
│                              [← ย้อนกลับ]   [ถัดไป →]        │
└──────────────────────────────────────────────────────────────┘
```

---

## 4. Step 3 — Add-ons + AI Chat (สำคัญสุด)

Split-screen: ซ้าย = picker, ขวา = AI chat

### Layout (Desktop)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Step ●●●○○○  เลือก feature + คุยกับ AI                              │
│  📦 Mode: A · Pure GAS  (ฟรีตลอดชีพ)              ราคาตอนนี้ ฿899   │
├────────────────────────────────────┬─────────────────────────────────┤
│  ADD-ONS                           │  AI ASSISTANT                   │
│  ────────────────────              │  ─────────────                  │
│  📐 Architecture                   │  AI: สวัสดีครับ ผมช่วยออกแบบ      │
│  [ ] SPA  +฿300  ⚠️→B              │       ระบบจองคิวให้คุณ            │
│  [ ] PWA  +฿500  ⚠️→B              │       มีลูกค้ากี่คน              │
│  [ ] Dark mode  +฿200              │       ที่จองพร้อมกันสูงสุด?      │
│  [ ] Multi-lang  +฿400  ⚠️→B       │                                 │
│                                    │  You: ประมาณ 20 คน               │
│  🔐 Auth                           │                                 │
│  ◉ ไม่ต้อง login                   │  AI: เข้าใจครับ จองล่วงหน้า      │
│  ○ Google OAuth  +฿300  ⚠️→B       │       ได้กี่วันก่อน?              │
│  ○ LINE Login    +฿500  ⚠️→B       │                                 │
│  ○ Email/PW      +฿700  ⚠️→B       │  ...                            │
│                                    │                                 │
│  🔗 Integrations                   │  Spec summary:                  │
│  [✓] LINE Push    +฿500            │  • ลูกค้าสูงสุด 20 คน            │
│  [ ] LINE Bot     +฿1,000          │  • จองล่วงหน้า 14 วัน             │
│  [ ] Telegram Bot +฿400            │  • LINE notify เปิด              │
│  [ ] Email        +฿400            │                                 │
│  ...                               │                                 │
│  🎨 Features                       │  ─────────────                  │
│  [✓] Calendar view +฿400           │  [_________________] [ส่ง]      │
│  [✓] Charts        +฿500           │                                 │
│  [ ] PDF print     +฿500           │  [💾 บันทึก draft]               │
│  ...                               │                                 │
│  🤖 AI                             │                                 │
│  [ ] AI chat      +฿1,500  ⚠️→B    │                                 │
│  ...                               │                                 │
│                                    │                                 │
├────────────────────────────────────┴─────────────────────────────────┤
│  💰 รวม ฿1,899 · Mode A · Standard      [← ย้อนกลับ]   [ถัดไป →]    │
└──────────────────────────────────────────────────────────────────────┘
```

### Layout (Mobile)
Tabs: `[Add-ons]` `[AI Chat]` — swipe between

### Force Mode B Warning (modal)

เมื่อ toggle add-on ที่ `force_mode = 'B'`:

```
┌──────────────────────────────────────────────────────────┐
│  ⚠️  ฟีเจอร์ "Camera capture" ต้องใช้ Mode Hybrid          │
│                                                          │
│  Mode A (Pure GAS) ไม่รองรับฟีเจอร์นี้เพราะ Google บล็อก  │
│  การใช้กล้องใน HTMLService                                │
│                                                          │
│  เปลี่ยนเป็น Mode B (Hybrid) จะ:                          │
│  ─ ราคา build เท่าเดิม (Mode A และ B ราคาเท่ากัน)         │
│  ─ + camera-capture add-on +฿500                         │
│  ─ + ค่ารายปี ฿300 ตั้งแต่ปีที่ 2                          │
│  ─ ต้องตั้งค่า Google Cloud Console เพิ่ม                  │
│                                                          │
│  📖 อ่านเพิ่มเรื่อง Mode A vs Mode B                       │
│                                                          │
│  [ยกเลิก feature นี้]   [ยอมรับและไป Mode B]            │
└──────────────────────────────────────────────────────────┘
```

### AI Chat Backend

`POST /api/gas-orders/{draftId}/chat`

```json
// Request
{
  "message": "ประมาณ 20 คน",
  "context": {
    "template_code": "booking",
    "mode": "A",
    "selected_addons": ["line-push", "view-calendar", "charts"],
    "previous_messages": [...]
  }
}

// Response
{
  "reply": "เข้าใจครับ จองล่วงหน้าได้กี่วัน?",
  "spec_ready": false,
  "spec_summary_partial": { "max_concurrent": 20 }
}

// When spec_ready=true
{
  "reply": "ผมได้ข้อมูลครบแล้ว ลองดู summary ทางขวา...",
  "spec_ready": true,
  "spec_json": {
    "sheet_schema": { ... },
    "workflows": [ ... ],
    "custom_rules": [ ... ]
  }
}
```

---

## 5. Step 4 — Preview + Quote

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Step ●●●●○○  ตรวจสอบและประเมินราคา                           │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────────────┐  ┌─────────────────────────────┐   │
│  │   PREVIEW (Mode A)  │  │   QUOTE                     │   │
│  │   [iframe]          │  │   ระบบจองคิวคลินิกแสงเดือน  │   │
│  │   [Desktop/Mobile]  │  │   Template: Booking         │   │
│  │   toggle            │  │   Tier: Standard · Mode A   │   │
│  │                     │  │                             │   │
│  │   [สลับดู Mode B    │  │   ราคา:                     │   │
│  │    ราคาเท่ากัน]      │  │   • Template      ฿499      │   │
│  └─────────────────────┘  │   • LINE Push    +฿500      │   │
│                           │   • Calendar     +฿400      │   │
│  ┌─────────────────────┐  │   • Charts       +฿500      │   │
│  │   SPEC SUMMARY      │  │   ────────────────────       │   │
│  │   (จาก AI chat)     │  │   รวม: ฿1,899                │   │
│  │   • ลูกค้าสูงสุด 20  │  │                             │   │
│  │   • จองล่วงหน้า 14d  │  │   📦 รวมในแพ็ค:              │   │
│  │   • LINE notify     │  │   ✓ ส่งมอบใน 3 วันทำการ     │   │
│  │   • ...             │  │   ✓ Email/LINE support      │   │
│  │   [แก้ไข]            │  │                             │   │
│  └─────────────────────┘  │   ⭐ Mode A:                 │   │
│                           │   ─ ไม่มีค่ารายปี             │   │
│                           │   ─ ใช้ได้ตลอดชีพ            │   │
│                           │   ─ คุณเป็นเจ้าของ 100%       │   │
│                           └─────────────────────────────┘   │
│                                                              │
│                              [← ย้อนกลับ]   [ดำเนินการ →]   │
└──────────────────────────────────────────────────────────────┘
```

---

## 6. Step 5 — Delivery Method (⭐ ใหม่)

### Layout — สำหรับ Mode A

```
┌──────────────────────────────────────────────────────────────────┐
│  Step ●●●●●○  วิธีการส่งมอบ                                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  📍 ระบบของคุณจะถูกติดตั้งใน Google Drive ของคุณเอง               │
│      คุณเป็นเจ้าของถาวร · ไม่มีค่ารายปี · ใช้ได้ตลอดชีพ           │
│                                                                  │
│  เลือกวิธีติดตั้ง:                                                │
│                                                                  │
│ ┌──────────────────────────┐  ┌──────────────────────────┐      │
│ │ 🎯 ส่งมอบให้เลย          │  │ 🛠️ ฉันจะ deploy เอง       │      │
│ │    (แนะนำ)               │  │                          │      │
│ │ ────────                 │  │ ────────                 │      │
│ │ คุณคลิก authorize 1 ครั้ง│  │ เราส่งโค้ด + วิดีโอสอน    │      │
│ │ เรา deploy ให้อัตโนมัติ   │  │ คุณ deploy ตามคู่มือ      │      │
│ │ ผ่าน Apps Script API     │  │                          │      │
│ │                          │  │                          │      │
│ │ ⏱ คุณใช้เวลา < 1 นาที    │  │ ⏱ คุณใช้เวลา 10-15 นาที  │      │
│ │ 🔧 เราทำให้ทั้งหมด        │  │ 🔧 คุณทำเองตามคู่มือ      │      │
│ │ 🔒 token ใช้แล้วลบทันที  │  │ 🔒 ไม่ต้อง OAuth กับเรา   │      │
│ │ 📝 update ในอนาคต        │  │ 📝 ต้อง re-deploy เอง    │      │
│ │    re-authorize 1 คลิก  │  │    ทุกครั้งที่ update     │      │
│ │                          │  │                          │      │
│ │ 💰 ฿1,899  (เท่ากัน)     │  │ 💰 ฿1,899  (เท่ากัน)     │      │
│ │ ◉ เลือก                  │  │ ○ เลือก                  │      │
│ └──────────────────────────┘  └──────────────────────────┘      │
│                                                                  │
│ 💡 ราคาเท่ากันทั้ง 2 แบบ — เลือกตามความถนัด ไม่ใช่ตามราคา        │
│                                                                  │
│ ➕ Add-on (optional):                                            │
│ [ ] Screen share training 30 นาที (+฿300)                       │
│     สอนวิธีดู/แก้ code + deploy + เพิ่ม feature เอง              │
│                                                                  │
│ ❓ [อ่าน FAQ] · OAuth คืออะไร? ปลอดภัยไหม?                        │
│                                                                  │
│                              [← ย้อนกลับ]   [ถัดไป →]            │
└──────────────────────────────────────────────────────────────────┘
```

### Layout — สำหรับ Mode B

```
┌──────────────────────────────────────────────────────────────────┐
│  📍 ระบบของคุณจะถูกติดตั้ง:                                       │
│     · Frontend: Vercel ของเรา (เรา host) ฿300/ปี                 │
│     · Backend (Sheet): ใน Google Drive ของคุณ                    │
│                                                                  │
│  ⚙️ ต้องตั้งค่า Google Cloud Console (ครั้งเดียว)                  │
│                                                                  │
│ ┌──────────────────────────┐  ┌──────────────────────────┐      │
│ │ 🛠️ ฉันตั้งเอง            │  │ 🎯 ให้เราตั้งให้           │      │
│ │ ────────                 │  │    (แนะนำ)               │      │
│ │ เราส่งคู่มือทีละขั้น      │  │ ────────                 │      │
│ │ + screenshot ภาษาไทย    │  │ Screen share 45 นาที     │      │
│ │                          │  │ เราทำให้ทุก step          │      │
│ │ ⏱ ใช้เวลา 30-60 นาที     │  │ ⏱ ใช้เวลา 45 นาที         │      │
│ │ 📋 ทำตาม 12 steps        │  │ 🤝 ทำพร้อมเรา             │      │
│ │ ⚠️  Maps ต้องผูกบัตร      │  │ ⚠️  เราอธิบาย limit ให้   │      │
│ │                          │  │                          │      │
│ │ 💰 ฟรี                   │  │ 💰 +฿1,200               │      │
│ │ ◉ เลือก                  │  │ ○ เลือก                  │      │
│ └──────────────────────────┘  └──────────────────────────┘      │
│                                                                  │
│ 💡 ถ้าเลือกแล้วทำเองไม่ไหว — upgrade ภายหลังได้                  │
│    จ่ายส่วนต่าง ไม่เสียเงินซ้ำ                                    │
└──────────────────────────────────────────────────────────────────┘
```

### State
```js
order.delivery_method =
  'mode-a-done-for-you' | 'mode-a-diy'
  | 'mode-b-self-setup' | 'mode-b-setup-service';
order.training_addon = true | false;
```

---

## 7. Step 6 — Submit + Contact Info

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  Step ●●●●●●  ยืนยันคำสั่งซื้อ                                │
├──────────────────────────────────────────────────────────────┤
│  📋 สรุปคำสั่งซื้อ                                            │
│  ระบบ: ระบบจองคิวคลินิกแสงเดือน                                │
│  Mode A · Done-For-You                                       │
│  ราคา: ฿1,899                                                │
│                                                              │
│  ติดต่อ:                                                     │
│  ชื่อ:       [____________________________]                  │
│  Email:     [____________________________]                  │
│  LINE ID:   [____________________________]  (option)         │
│                                                              │
│  ☑ ฉันได้อ่านและยอมรับ [นโยบายการคืนเงิน]                     │
│  ☑ ฉันเข้าใจว่าจะคุยรายละเอียดและชำระเงินทาง LINE             │
│                                                              │
│  ℹ️  ขั้นตอนถัดไปหลังกดยืนยัน:                                  │
│     1. คุณจะได้รหัสคำสั่งซื้อ (ORDER-XXXXXX)                  │
│     2. Add LINE OA เรา → ส่งข้อความ (เรากรอกให้แล้ว)           │
│     3. ทีมเราตอบกลับใน 30 นาที + ส่ง PromptPay QR             │
│     4. โอนเงิน + ส่งสลิปใน LINE → เริ่มผลิตทันที                │
│                                                              │
│                              [← ย้อนกลับ]  [ยืนยันคำสั่งซื้อ]│
└──────────────────────────────────────────────────────────────┘
```

### Backend
`POST /api/gas-orders`
- Insert `gas_orders` (status='submitted')
- Insert `gas_specs` (version=1)
- Generate `order_number` = `ORDER-{6hex}`
- LINE Push to admin: "New order ORDER-XXXX · ฿{total}"
- Return `{ order_id, order_number, line_oa_url, prefilled_message_url }`
- Frontend redirect → `gas-builder-success.html?order={order_id}`

---

## 8. Success Page (`gas-builder-success.html`)

### Layout
```
┌──────────────────────────────────────────────────────────────┐
│  ✓ บันทึกคำสั่งซื้อแล้ว                                       │
│                                                              │
│  รหัสคำสั่งซื้อ:                                              │
│  ┌─────────────────────────┐                                 │
│  │   ORDER-7f3a9c          │  [📋 คัดลอก]                   │
│  └─────────────────────────┘                                 │
│                                                              │
│  ──────────────────────────────────────────────────          │
│  ขั้นตอนถัดไป — Add LINE เพื่อยืนยันและชำระเงิน                │
│  ──────────────────────────────────────────────────          │
│                                                              │
│   ┌──────────────────────────┐                               │
│   │   [██ QR LINE OA ██]     │                               │
│   │   @kpgas                 │                               │
│   └──────────────────────────┘                               │
│                                                              │
│   หรือคลิกปุ่มด้านล่าง (เปิดในแอป LINE)                       │
│   ┌────────────────────────────────────────────────────┐    │
│   │  🟢 เพิ่ม @kpgas + เริ่มแชท                          │    │
│   └────────────────────────────────────────────────────┘    │
│                                                              │
│   💬 ข้อความที่จะส่งให้เรา (กรอกให้แล้ว):                     │
│   ┌──────────────────────────────────────────────────────┐  │
│   │ สวัสดีครับ/ค่ะ                                       │  │
│   │ สั่งซื้อ ORDER-7f3a9c                                │  │
│   │ ระบบจองคิว · Mode A · Done-For-You                  │  │
│   │ ยอด ฿1,899                                          │  │
│   └──────────────────────────────────────────────────────┘  │
│                                                              │
│   เราจะ:                                                     │
│   ⏱  ตอบกลับภายใน 30 นาที (เวลาทำการ 9:00-21:00)            │
│   💰 ส่ง QR PromptPay ให้                                    │
│   ❓ ตอบคำถามเพิ่มเติม / ปรับ scope ได้                       │
│   ✓  เริ่มสร้างทันทีหลังยืนยันยอด                            │
│                                                              │
│   [ดูสรุปคำสั่งซื้อ]   [กลับหน้าหลัก]                         │
└──────────────────────────────────────────────────────────────┘
```

### Code Snippet (LINE URL scheme)
```javascript
// gas-builder-success.html
const OA_ID = '{LINE_OA_BASIC_ID}';  // เช่น '@kpgas'

function buildLineMessageUrl(orderNumber, templateName, mode, delivery, total) {
  const msg = [
    'สวัสดีครับ/ค่ะ',
    `สั่งซื้อ ${orderNumber}`,
    `${templateName} · Mode ${mode} · ${delivery}`,
    `ยอด ฿${total.toLocaleString()}`
  ].join('\n');

  return `https://line.me/R/oaMessage/${encodeURIComponent(OA_ID)}/?${encodeURIComponent(msg)}`;
}

// QR fallback (สำหรับลูกค้าที่เปิดบน desktop)
// แสดง QR แทนปุ่ม
```

---

## 9. FAQ Modal (เปิดจากปุ่ม "อ่าน FAQ" ใน Step 4.5)

ดูเนื้อหา FAQ เต็มที่ `docs/FAQ-CUSTOMER.md`

แสดงเป็น accordion:
- OAuth คืออะไร? ปลอดภัยไหม?
- ถ้าเลิกบริการ KP ระบบจะเป็นยังไง?
- Update ในอนาคตทำยังไง?
- ถ้าเลือก DIY แล้วทำไม่ได้?
- ค่ารายปี ฿0 จริงเหรอ?
- เพิ่ม feature ภายหลังได้ไหม?
- ทำไมต้องเลือก Mode A หรือ B?
- Setup Service คุ้มไหม?

---

## 10. Upsell Flow (จาก Prompt Creator)

ตำแหน่ง: `js/save-prompt.js` หลัง save saved prompt เสร็จ

### Trigger condition
```js
function shouldShowGasUpsell(promptMetadata) {
  if (promptMetadata.platform === 'google-apps-script') return true;

  const keywords = /\b(เว็บ|web|sheet|sheets|api|form|dashboard|crm|automation|ระบบ|จัดการ|บันทึก)\b/i;
  if (keywords.test(promptMetadata.content)) return true;

  return false;
}

// Throttle: ไม่เด้งบ่อยกว่า 7 วัน/user
function canShowUpsell() {
  const last = localStorage.getItem('gasUpsellDismissedAt');
  if (!last) return true;
  return (Date.now() - +last) > 7 * 86400000;
}
```

### Modal
```
┌──────────────────────────────────────────────────────────────┐
│                                                          [×] │
│   🎯 อยากได้ระบบนี้ใช้งานจริงไหม?                              │
│                                                              │
│   พร้อมที่คุณเพิ่งสร้าง เหมาะกับการทำเป็นระบบบน               │
│   Google Apps Script + Sheet พอดี                            │
│                                                              │
│   เราสร้างให้ได้เลย เริ่มต้น ฿499                              │
│   ✓ ฟรี hosting ตลอดชีพ (Mode A)                              │
│   ✓ ส่งมอบใน 3 วันทำการ                                       │
│   ✓ คุณไม่ต้อง deploy เอง (Done-For-You)                       │
│                                                              │
│   [ไม่ตอนนี้]              [ดูราคา + สั่งสร้าง →]              │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- "ดูราคา + สั่งสร้าง" → `gas-builder.html?from=prompt&promptId={id}`
- prefill template ใน Step 1 จากการ analyze prompt content (option)
- prefill AI chat context

---

## 11. Admin Queue View (`admin-gas-orders.html`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  Admin · GAS Orders Queue                                            │
├──────────────────────────────────────────────────────────────────────┤
│  Tabs: [Submitted (3)] [Paid (1)] [In Production (1)] [Delivered]    │
│                                                                      │
│  ─── SUBMITTED (รอชำระ — ตามใน LINE) ───                              │
│                                                                      │
│  🟡 ORDER-7f3a9c    ฿1,899  Mode A · Done-For-You · จองคิว           │
│  user@email · 25 May 13:45 · LINE: @somchai_xy                       │
│  [ดู spec]  [💬 ไป LINE chat]  [✓ Mark Paid]  [❌ Reject]            │
│  ────────────────────────────────────────────────────────────────    │
│  🟡 ORDER-7e2b1d    ฿1,299  Mode A · DIY · CRM                       │
│  ...                                                                 │
│                                                                      │
│  ─── PAID (พร้อม start build) ───                                    │
│                                                                      │
│  🔵 ORDER-7c1a4e    ฿2,499  Mode B · Setup Service · POS             │
│  paid 25 May 14:30                                                   │
│  [ดู spec]  [▶ Start Build]                                          │
│                                                                      │
│  ─── IN PRODUCTION ───                                               │
│                                                                      │
│  🟢 ORDER-7d2e5f    ฿1,899  Mode A · Done-For-You · Booking          │
│  Started 25 May 11:00 · กำลัง code                                   │
│  [ดู progress]  [ส่ง OAuth link ลูกค้า]                              │
└──────────────────────────────────────────────────────────────────────┘
```

### Actions

**[✓ Mark Paid]** → modal:
```
ยืนยันได้รับเงินสำหรับ ORDER-7f3a9c
ยอด ฿1,899

หมายเหตุ (option): [_______________]
(เช่น "ตรงยอด เวลา 13:45 ผ่าน PromptPay")

[ยกเลิก]  [ยืนยัน]
```
- POST `/api/admin/gas-orders/{id}/mark-paid`
- Update status → paid → in_queue
- LINE Push ลูกค้า: "ยืนยันชำระแล้ว → เริ่มผลิตใน 30 นาที"

**[▶ Start Build]** → 4 paths ตาม delivery_method:
- `mode-a-diy` → generate zip + ส่ง LINE
- `mode-a-done-for-you` → generate code + signed OAuth URL + ส่ง LINE
- `mode-b-self-setup` → clone repo + open Cursor + ส่ง Google Cloud guide
- `mode-b-setup-service` → clone repo + open Cursor + นัด screen share

---

## 12. Customer Projects Page (`customer-projects.html`)

```
┌──────────────────────────────────────────────────────────────────────┐
│  ระบบของฉัน                                                          │
├──────────────────────────────────────────────────────────────────────┤
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  ระบบจองคิวคลินิกแสงเดือน · Mode A          🟢 Live ตลอดชีพ   │ │
│  │  ─────────────────────────                                     │ │
│  │  URL: script.google.com/macros/s/{id}/exec          [เปิด →]   │ │
│  │  Google Sheet                                       [เปิด →]   │ │
│  │                                                                │ │
│  │  ส่งมอบ: 25 พ.ค. 2026                                          │ │
│  │  ค่ารายปี: ไม่มี (ใช้ได้ตลอดชีพ)                                │ │
│  │  ─────────────────────────                                     │ │
│  │  [📞 ติดต่อ LINE]   [🔄 Re-deploy (update)]   [📥 export code] │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  POS ร้านขนม · Mode B                       🟢 Live            │ │
│  │  ─────────────────────────                                     │ │
│  │  URL: kanom-pos.vercel.app                          [เปิด →]   │ │
│  │  Custom domain: kanom-pos.com                       [จัดการ]   │ │
│  │                                                                │ │
│  │  ส่งมอบ: 20 พ.ค. 2026                                          │ │
│  │  หมดอายุ: 20 พ.ค. 2027  (เหลือ 360 วัน)                        │ │
│  │  [📞 ติดต่อ LINE]   [🔄 ต่ออายุ ฿300/ปี]                         │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  ┌────────────────────────────────────────────────────────────────┐ │
│  │  CRM ทีมเซลล์ · Mode A                       ⏳ กำลังผลิต     │ │
│  │  คาดส่งมอบ: 27 พ.ค. 2026                                       │ │
│  │  [💬 ดูแชท LINE]                                                │ │
│  └────────────────────────────────────────────────────────────────┘ │
│                                                                      │
│  [+ สั่งสร้างระบบใหม่]                                                │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 13. LINE Notification Templates

ดู `docs/LINE-INTEGRATION-GUIDE.md` สำหรับ template ทั้งหมด — ตัวอย่างย่อ:

**`gas_payment_verified`**
```
✓ ยืนยันการชำระเงินแล้ว
รหัส: ORDER-7f3a9c
เริ่มสร้างระบบให้คุณ — คาดส่งมอบ 3 วันทำการ
```

**`gas_oauth_needed`** (Mode A · Done-For-You)
```
📥 พร้อมติดตั้งระบบของคุณแล้ว
ORDER-7f3a9c · ระบบจองคิว

คลิก link นี้เพื่อ authorize ติดตั้ง:
👉 https://kpgas.app/oauth/install?o={id}&t={token}

(link หมดอายุใน 24 ชม.)
```

**`gas_delivered`**
```
🎉 ระบบของคุณพร้อมใช้งานแล้ว!
ระบบ: ระบบจองคิวคลินิกแสงเดือน
URL: https://script.google.com/macros/s/{id}/exec
Sheet: {sheet_url}

📖 คู่มือ: {docs_url}
💬 มีคำถาม? ตอบกลับข้อความนี้ได้เลย

ขอบคุณที่ใช้บริการ
```

---

## 14. Error States & Edge Cases

| Case | Handling |
|---|---|
| User ปิดเบราว์เซอร์กลาง wizard | Auto-save ทุก 30 วินาที (status='draft') · กลับมาได้ผ่าน dashboard |
| User ไม่กรอก email/LINE ID | บังคับใส่อย่างน้อย 1 ช่อง (email ค่อย default) |
| สลิปไม่ผ่าน (admin reject ใน LINE) | Admin คลิก "Reject" ใน admin panel → status='rejected' → LINE push เหตุผล |
| Build เกิน 7 วัน | Auto-send apology LINE + เสนอ refund 30% |
| AI chat ตอบไม่เข้าใจ | Fallback ปุ่ม "ข้ามไปสรุปเอง" — เปิด text area กรอก requirement ดิบ |
| Customer ไม่คลิก OAuth link ภายใน 24 ชม. | Token expire → admin click "Send new link" |
| Customer ปฏิเสธ Google OAuth | Admin chat LINE → suggest เปลี่ยน delivery_method เป็น DIY |
| Custom domain DNS ผิด | dashboard แสดง warning + วิธีแก้ + ปุ่ม "ขอ support" |
| Vercel API ล้ม | Admin manual deploy + log error · status stays 'in_production' |
| Customer Sheet permission หาย | LINE push "Sheet เข้าถึงไม่ได้" + วิธี re-share |

---

## 15. Analytics Events ที่ต้อง track

ใน `prompt_stats` (เดิม) — เพิ่ม events:

```
gas_template_viewed
gas_template_selected
gas_style_changed
gas_addon_toggled
gas_force_mode_b_shown
gas_force_mode_b_accepted
gas_force_mode_b_declined
gas_ai_chat_started
gas_ai_chat_completed
gas_preview_viewed
gas_delivery_method_selected   ← ใหม่
gas_setup_service_added
gas_training_addon_added
gas_quote_viewed
gas_submit_clicked
gas_line_add_clicked            ← ใหม่
gas_line_message_sent           ← ใหม่ (track via LINE webhook)
gas_upsell_shown
gas_upsell_clicked
gas_upsell_dismissed
gas_paid                        ← ใหม่ (admin mark)
gas_delivered                   ← ใหม่
gas_renewed                     ← ใหม่ (Mode B)
```

ใช้สำหรับ:
- Conversion funnel (view → select → AI → quote → submit → LINE add → paid)
- Drop-off จุดไหนเยอะ → improve
- Add-on popularity ranking
- Upsell effectiveness (% prompt creator users → GAS order)
- Delivery method distribution (DIY vs Done-For-You ratio)
- LINE add rate (% submitted → LINE message sent)
