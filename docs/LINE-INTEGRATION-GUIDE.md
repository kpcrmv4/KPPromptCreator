# LINE Integration Guide

> คู่มือ setup LINE OA + Messaging API + template messages สำหรับ KP GAS Builder
> ใช้กับ: admin notification, customer contact, delivery notification, renewal reminder
> Last updated: 2026-05-25

---

## 1. Overview — เราใช้ LINE ทำอะไร

| Use case | LINE feature | Direction |
|---|---|---|
| Customer Add Friend หลัง checkout | LINE OA + URL scheme | Customer → us |
| Admin notify order ใหม่ | Messaging API Push | System → admin's LINE |
| Notify customer "paid verified" | Messaging API Push | System → customer's LINE |
| Send OAuth install link (Mode A · Done-For-You) | Messaging API Push | System → customer |
| Delivery notification (URL ระบบ) | Messaging API Push | System → customer |
| Renewal reminder (Mode B) | Messaging API Push schedule | System → customer |
| Manual chat support | LINE OA inbox | Bidirectional |

⚠️ **LINE Notify ถูก deprecated** มี.ค. 2025 — เราใช้ Messaging API Push แทนทั้งหมด

---

## 2. Setup Steps (One-time)

### 2.1 สร้าง LINE Official Account

1. ไปที่ https://www.linebiz.com/th/entry/
2. สมัคร LINE OA — เลือก:
   - **Free Basic ID** (`@xxxxxxxx` ตัวเลขมั่ว) — ฟรี
   - **Premium ID** (`@kpgas` ชื่อสวย) — ฿2,200/ปี ⭐ แนะนำ
3. Verify เบอร์โทร
4. กรอกข้อมูล:
   - ชื่อ: KP GAS Builder
   - หมวด: Software / IT Services
   - คำอธิบาย: บริการสั่งสร้างระบบ Google Apps Script + Sheet
5. อัปโลโก้ + cover (1040 x 1040 px)
6. **บันทึก Basic ID** ที่ได้ (เช่น `@kpgas` หรือ `@123abcde`)

### 2.2 สร้าง Messaging API Channel

1. ไปที่ https://developers.line.biz/console/
2. Login ด้วย LINE account
3. สร้าง Provider (ถ้ายังไม่มี):
   - Name: KP GAS Builder
4. สร้าง Channel:
   - Type: **Messaging API**
   - Channel name: KP GAS Builder Bot
   - Channel description: บริการสั่งสร้างระบบ GAS
   - Category: Software
   - Subcategory: Tools / Utilities
5. Link กับ LINE OA ที่สร้างไว้
6. **บันทึก:**
   - Channel ID (number)
   - Channel Secret
7. ไปที่ tab **Messaging API:**
   - Issue Channel Access Token (Long-lived) → **บันทึก**
   - Webhook URL: `https://{site_url}/api/line/webhook` (ตั้งหลังเรามี endpoint)
   - Use webhook: enable
   - Auto-reply messages: disable
   - Greeting messages: disable (เราใช้ template เอง)

### 2.3 เก็บค่าใน .env

```bash
LINE_OA_BASIC_ID=@kpgas              # หรือที่ได้จริง
LINE_CHANNEL_ID=1234567890
LINE_CHANNEL_SECRET=xxx
LINE_CHANNEL_ACCESS_TOKEN=xxx
LINE_WEBHOOK_SECRET=xxx              # = LINE_CHANNEL_SECRET (LINE ใช้ secret เดียวกัน)
ADMIN_LINE_USER_IDS=Uxxx,Uyyy        # ดู §2.4
```

### 2.4 หา Admin LINE User ID

LINE User ID เป็น ID ส่วนตัวที่ใช้ตอน push message — ต้องดึงครั้งเดียว

วิธีดึง:
1. Admin (คุณ) Add LINE OA ที่สร้าง
2. ส่งข้อความใดก็ได้ไปที่ OA (เช่น "test")
3. ดู webhook log ที่ Channel console → จะเห็น `source.userId` = `Uxxxxxxxx`
4. Copy → save ใน `.env` ตัวแปร `ADMIN_LINE_USER_IDS`

> ถ้ายังไม่มี webhook endpoint — ใช้ ngrok ชั่วคราว: `ngrok http 3000` → ตั้ง webhook URL ชั่วคราว → ดึง userId → revert

### 2.5 ตั้ง Rich Menu

ใน LINE Official Account Manager → Rich Menu:

```
┌─────────────────────────────────────┐
│  📋 สถานะออเดอร์  │  📖 คู่มือ        │
│  ─────────────────│─────────────────│
│  💬 ติดต่อ admin  │  🎁 โปรโมชั่น     │
└─────────────────────────────────────┘
```

Action links:
- สถานะออเดอร์ → `https://{site_url}/orders.html`
- คู่มือ → `https://{site_url}/docs/FAQ-CUSTOMER.md` (host เป็น HTML page)
- ติดต่อ admin → message action: "สวัสดีครับ ต้องการสอบถาม..."
- โปรโมชั่น → URI action ไปหน้า promo

---

## 3. API Endpoints (ที่เราต้องสร้าง)

### 3.1 `POST /api/line/push` (internal)

ใช้ส่ง message ไปยัง user ที่ระบุ

```javascript
// lib/line.js
async function pushMessage(toUserId, messages) {
  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.LINE_CHANNEL_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: toUserId, messages })
  });
  if (!res.ok) throw new Error(`LINE push failed: ${res.status}`);
  return res.json();
}
```

### 3.2 `POST /api/line/webhook` (LINE → us)

รับ event จาก LINE (user ส่งข้อความ, user follow OA, etc.)

```javascript
// api/line/webhook.js
import crypto from 'crypto';

export default async function handler(req, res) {
  // 1. Verify signature
  const signature = req.headers['x-line-signature'];
  const body = JSON.stringify(req.body);
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(body)
    .digest('base64');
  if (hash !== signature) return res.status(403).end();

  // 2. Process events
  for (const event of req.body.events) {
    if (event.type === 'message' && event.message.type === 'text') {
      // Try to match ORDER-XXXXXX in message
      const match = event.message.text.match(/ORDER-([a-f0-9]{6})/i);
      if (match) {
        // Link this LINE user to the order
        await linkLineUserToOrder(match[0], event.source.userId);
      }
      // (Phase 2: AI chatbot reply)
    } else if (event.type === 'follow') {
      // Welcome message
      await replyMessage(event.replyToken, [{
        type: 'text',
        text: WELCOME_MESSAGE
      }]);
    }
  }

  res.status(200).end();
}
```

### 3.3 LINE URL Scheme (Frontend)

สำหรับปุ่ม "Add LINE OA + send prefilled message"

```javascript
// js/gas-builder.js
function buildLineMessageUrl(orderNumber, templateName, mode, delivery, total) {
  const msg = [
    'สวัสดีครับ/ค่ะ',
    `สั่งซื้อ ${orderNumber}`,
    `${templateName} · Mode ${mode} · ${delivery}`,
    `ยอด ฿${total.toLocaleString()}`
  ].join('\n');

  // เปิด LINE app + send message
  return `https://line.me/R/oaMessage/${encodeURIComponent(LINE_OA_BASIC_ID)}/?${encodeURIComponent(msg)}`;
}

// QR code URL (สำหรับลูกค้า desktop)
function buildOaQrUrl() {
  // LINE OA QR: https://qr-official.line.me/sid/L/{basic_id_without_at}.png
  const id = LINE_OA_BASIC_ID.replace('@', '');
  return `https://qr-official.line.me/sid/L/${id}.png`;
}
```

---

## 4. Message Templates

### 4.1 Welcome (เมื่อ user follow OA)

```
สวัสดีครับ 👋
ขอบคุณที่ Add KP GAS Builder

ถ้ามีรหัสคำสั่งซื้อแล้ว — กรุณาส่งข้อความบอกเราได้เลย
ตัวอย่าง: "สั่งซื้อ ORDER-7f3a9c"

ทีมเราจะตอบกลับใน 30 นาที (เวลาทำการ 9:00-21:00)

📋 ดูคู่มือ: {site_url}/docs/FAQ-CUSTOMER
💬 ถามฟรี ไม่มีอั้น
```

### 4.2 Admin Notification — Order ใหม่

ส่งไปยัง admin LINE user เมื่อ status='submitted'

```
🔔 มี order ใหม่

รหัส: {order_number}
จาก: {customer_name} ({customer_email})
LINE: {customer_line_basic_id || '-'}
ยอด: ฿{total}
แพ็ค: {template_name} · Mode {mode}
Delivery: {delivery_method}

[ดู spec →]({admin_url})
```

### 4.3 Customer — Payment Verified

ส่งหลัง admin click "Mark Paid"

```
✓ ยืนยันการชำระเงินแล้ว

รหัส: {order_number}
ยอด: ฿{total}

เริ่มสร้างระบบให้คุณ — คาดส่งมอบใน {eta} วันทำการ
ติดตามสถานะ: {dashboard_url}
```

### 4.4 Customer — OAuth Install Link (Mode A · Done-For-You)

```
📥 พร้อมติดตั้งระบบของคุณแล้ว

รหัส: {order_number}
ระบบ: {project_name}

👇 คลิก link เพื่อ authorize:
{oauth_install_url}

🔒 เราขอสิทธิ์เฉพาะที่จำเป็น (drive.file, script.projects)
⏰ link หมดอายุใน 24 ชม.
🗑 token จะถูกลบทันทีหลัง deploy

อ่านเพิ่ม: {faq_url}
```

### 4.5 Customer — Delivered

```
🎉 ระบบของคุณพร้อมใช้งานแล้ว!

ระบบ: {project_name}
URL: {gas_web_app_url || vercel_url}
Sheet: {sheet_url}

📖 คู่มือ: {docs_url}
💬 มีคำถาม? ตอบกลับข้อความนี้ได้เลย

ขอบคุณที่ใช้บริการ KP GAS Builder 🙏
```

### 4.6 Customer — Renewal 30 Days (Mode B เท่านั้น)

```
⏰ ระบบของคุณจะหมดอายุใน 30 วัน

ระบบ: {project_name}
หมดอายุ: {expires_at}

ต่ออายุ ฿300/ปี → {renew_url}
หรือตอบ "ต่ออายุ" + รหัสคำสั่งซื้อใน chat นี้

ถ้าไม่ต่อ:
─ ระบบจะ pause หลังวันหมดอายุ
─ Sheet + GAS code ของคุณยังอยู่ใน Drive ไม่หาย
─ มี grace period 90 วันให้ต่ออายุได้
```

### 4.7 Customer — Renewal 7 Days

```
⚠️ เหลือ 7 วันก่อนหมดอายุ

ระบบ: {project_name}
หมดอายุ: {expires_at}

ต่ออายุ ฿300/ปี → {renew_url}
หรือตอบ "ต่ออายุ" ในแชทนี้
```

### 4.8 Customer — Expired

```
🚨 ระบบของคุณหมดอายุแล้ว

ระบบ: {project_name}
หมดอายุเมื่อ: {expires_at}

ตอนนี้ระบบจะแสดงหน้า "Service Expired" ให้ผู้ใช้
─ Data ของคุณใน Sheet + GAS ยังอยู่ ไม่หาย
─ มีเวลา 90 วัน ต่ออายุ ฿300 → กลับมาใช้ได้
─ เกิน 90 วัน คิดค่า restore ฿200

ต่ออายุ: {renew_url}
```

### 4.9 Customer — Renewed

```
✓ ต่ออายุสำเร็จ

ระบบ: {project_name}
หมดอายุใหม่: {new_expires_at}
ยอด: ฿{amount}

ระบบกลับมาใช้งานได้ปกติแล้ว
ขอบคุณที่ใช้บริการต่อ 🙏
```

---

## 5. Implementation Helper (lib/line.js)

```javascript
// lib/line.js
import crypto from 'crypto';

const LINE_API = 'https://api.line.me/v2/bot';
const TOKEN = process.env.LINE_CHANNEL_ACCESS_TOKEN;

export async function pushMessage(toUserId, messages) {
  if (!Array.isArray(messages)) messages = [messages];
  const res = await fetch(`${LINE_API}/message/push`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ to: toUserId, messages })
  });
  if (!res.ok) {
    const err = await res.text();
    console.error('[LINE push]', res.status, err);
    throw new Error(`LINE push failed: ${res.status}`);
  }
  return res.json();
}

export async function pushAdmins(messages) {
  const adminIds = (process.env.ADMIN_LINE_USER_IDS || '').split(',').filter(Boolean);
  await Promise.all(adminIds.map(id => pushMessage(id, messages)));
}

export async function replyMessage(replyToken, messages) {
  if (!Array.isArray(messages)) messages = [messages];
  const res = await fetch(`${LINE_API}/message/reply`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ replyToken, messages })
  });
  if (!res.ok) throw new Error(`LINE reply failed: ${res.status}`);
  return res.json();
}

export function verifySignature(rawBody, signature) {
  const hash = crypto
    .createHmac('sha256', process.env.LINE_CHANNEL_SECRET)
    .update(rawBody)
    .digest('base64');
  return hash === signature;
}

export function buildOaMessageUrl(oaId, text) {
  return `https://line.me/R/oaMessage/${encodeURIComponent(oaId)}/?${encodeURIComponent(text)}`;
}

export function buildOaQrUrl(oaId) {
  const id = oaId.replace('@', '');
  return `https://qr-official.line.me/sid/L/${id}.png`;
}
```

---

## 6. Notification Helpers (lib/notify.js — extend เดิม)

```javascript
// lib/notify.js
import { pushMessage, pushAdmins } from './line.js';

export async function notifyOrderReceived(order) {
  await pushAdmins([{
    type: 'text',
    text: `🔔 มี order ใหม่\n\nรหัส: ${order.order_number}\nจาก: ${order.customer_name} (${order.customer_email})\nLINE: ${order.line_basic_id || '-'}\nยอด: ฿${order.price.toLocaleString()}\nแพ็ค: ${order.template_name} · Mode ${order.mode}\nDelivery: ${order.delivery_method}\n\nดู: ${process.env.SITE_URL}/admin-gas-orders.html?id=${order.id}`
  }]);
}

export async function notifyPaymentVerified(order) {
  if (!order.line_user_id) return;  // ลูกค้ายังไม่ Add LINE
  await pushMessage(order.line_user_id, [{
    type: 'text',
    text: `✓ ยืนยันการชำระเงินแล้ว\n\nรหัส: ${order.order_number}\nยอด: ฿${order.price.toLocaleString()}\n\nเริ่มสร้างระบบให้คุณ — คาดส่งมอบใน ${etaForTier(order.tier)} วันทำการ\nติดตามสถานะ: ${process.env.SITE_URL}/orders.html`
  }]);
}

export async function notifyOAuthNeeded(order, oauthUrl) {
  if (!order.line_user_id) return;
  await pushMessage(order.line_user_id, [{
    type: 'text',
    text: `📥 พร้อมติดตั้งระบบของคุณแล้ว\n\nรหัส: ${order.order_number}\nระบบ: ${order.project_name}\n\n👇 คลิก link เพื่อ authorize:\n${oauthUrl}\n\n🔒 เราขอสิทธิ์เฉพาะที่จำเป็น\n⏰ link หมดอายุใน 24 ชม.\n🗑 token จะถูกลบทันทีหลัง deploy`
  }]);
}

export async function notifyDelivered(project) {
  if (!project.user_line_id) return;
  await pushMessage(project.user_line_id, [{
    type: 'text',
    text: `🎉 ระบบของคุณพร้อมใช้งานแล้ว!\n\nระบบ: ${project.project_name}\nURL: ${project.gas_web_app_url || project.vercel_url}\nSheet: ${project.sheet_url}\n\n📖 คู่มือ: ${process.env.SITE_URL}/docs/FAQ-CUSTOMER\n💬 มีคำถาม? ตอบกลับข้อความนี้ได้เลย\n\nขอบคุณที่ใช้บริการ KP GAS Builder 🙏`
  }]);
}

function etaForTier(tier) {
  return tier === 'starter' ? 2 : tier === 'standard' ? 3 : 5;
}
```

---

## 7. Testing

### 7.1 Test push manually

```bash
curl -X POST https://api.line.me/v2/bot/message/push \
  -H "Authorization: Bearer $LINE_CHANNEL_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "U-YOUR-ADMIN-ID",
    "messages": [{"type": "text", "text": "Test message"}]
  }'
```

### 7.2 Test webhook (ngrok)

```bash
# Terminal 1
ngrok http 3000

# Copy https URL → ใส่ใน LINE Console webhook URL

# Terminal 2
npm run dev

# ส่งข้อความใน LINE OA → ดู log
```

---

## 8. Quota & Pricing (LINE Official)

| Plan | ราคา | Push message/เดือน |
|---|---|---|
| Free | ฿0 | 200 |
| Starter | ฿1,150/เดือน | 5,000 |
| Pro | ฿4,500/เดือน | 35,000 |

**Estimated usage:** 10 orders/เดือน × 5 messages = 50 messages/เดือน → ใช้ Free tier ได้นาน
จะอัปเกรดเมื่อ > 200 msg/เดือน

**Tip ประหยัด:**
- Multicast แทน Push หลายครั้ง (1 multicast นับเป็น 1 message ต่อ user receive)
- รวม message หลาย ๆ ตัวใน 1 push call (LINE นับเป็น 1)

---

## 9. Troubleshooting

| ปัญหา | สาเหตุที่เป็นไปได้ | วิธีแก้ |
|---|---|---|
| 401 Unauthorized | Token หมดอายุ | Issue ใหม่ใน Console |
| 403 Forbidden | Signature ไม่ตรง | เช็ค `LINE_CHANNEL_SECRET` |
| 400 ใน push | User block OA ไปแล้ว | Catch + log + ไม่ retry |
| Webhook ไม่เข้า | Use webhook ไม่ enable | เปิดใน Console |
| Auto-reply เด้ง | Auto-reply ยัง enable | Disable ใน Console |
| User Add แล้วไม่ได้ welcome | Greeting message disable | เราใช้ webhook follow event แทน |

---

## 10. Future (Phase 2+)

- **LINE Chatbot อัตโนมัติ** — ตอบ FAQ อัตโนมัติด้วย AI
- **LIFF** — แสดง dashboard ใน LINE app เลย
- **Flex Message** — order summary แบบ rich card
- **Multicast renewal reminder** — ส่งครั้งเดียว ถึงทุก user ที่ใกล้หมดอายุ
