# KP Prompt Creator — Marketplace Deployment Plan

## สถานะโปรเจค
- **เดิม**: Static site (Vanilla JS) → GitHub Pages
- **ใหม่**: Vercel + Supabase (Auth, DB, Storage) + TrueMoney อั่งเปา

---

## Phase 1: โครงสร้างโปรเจค Vercel + Supabase ✅
- [x] 1.1 สร้าง `package.json` + ติดตั้ง dependencies (supabase-js, dotenv)
- [x] 1.2 สร้างโครงสร้างโฟลเดอร์ `api/` สำหรับ Vercel Serverless Functions
- [x] 1.3 สร้าง `vercel.json` config (routes, env)
- [x] 1.4 สร้าง `.env.example` สำหรับ env vars ที่ต้องใช้
- [x] 1.5 สร้าง `lib/supabase.js` client helper

## Phase 2: Supabase Database Schema ✅
- [x] 2.1 สร้าง `supabase/schema.sql` — ตาราง users, prompts, prompt_images, orders, reviews, credits, payouts, settings
- [x] 2.2 เพิ่ม Row Level Security (RLS) policies
- [x] 2.3 เพิ่ม indexes สำหรับ performance

## Phase 3: Auth System ✅
- [x] 3.1 สร้าง `api/auth/register.js` — สมัครสมาชิก (buyer/seller)
- [x] 3.2 สร้าง `api/auth/login.js` — เข้าสู่ระบบ
- [x] 3.3 สร้าง `api/auth/me.js` — ดึงข้อมูล user ปัจจุบัน
- [x] 3.4 สร้าง `lib/auth.js` — middleware ตรวจ JWT

## Phase 4: Marketplace CRUD API ✅
- [x] 4.1 สร้าง `api/prompts/index.js` — GET (list + filter + search) / POST (สร้าง prompt ใหม่)
- [x] 4.2 สร้าง `api/prompts/[id].js` — GET (detail) / PUT (update) / DELETE
- [x] 4.3 สร้าง `api/reviews/index.js` — GET / POST รีวิว
- [x] 4.4 สร้าง `api/orders/index.js` — GET (ประวัติ) / POST (สร้างคำสั่งซื้อ)

## Phase 5: TrueMoney อั่งเปา Redeem System ✅
- [x] 5.1 สร้าง `api/topup/redeem.js` — รับลิงก์อั่งเปา → parse hash → redeem → เติมเครดิต
- [x] 5.2 สร้าง `api/credits/balance.js` — เช็คยอดเครดิต
- [x] 5.3 สร้าง `api/credits/history.js` — ประวัติเครดิต
- [x] 5.4 Logic: เช็ค hash ซ้ำ → POST redeem → เชื่อ response → เติมเครดิต

## Phase 6: ระบบซื้อ Prompt ด้วยเครดิต ✅
- [x] 6.1 สร้าง `api/prompts/purchase.js` — เช็คเครดิต → ตัดเครดิต → ปลดล็อค prompt → บันทึก order
- [x] 6.2 สร้าง `api/prompts/download.js` — ดาวน์โหลด prompt content (เฉพาะคนที่ซื้อแล้ว)
- [x] 6.3 คำนวณค่าคอมมิชชั่น → แบ่งให้ seller

## Phase 7: Seller Dashboard API ✅
- [x] 7.1 สร้าง `api/seller/stats.js` — ยอดขาย, รายได้, จำนวน prompt
- [x] 7.2 สร้าง `api/seller/payouts.js` — ประวัติการถอนเงิน / ขอถอนเงิน

## Phase 8: Admin API ✅
- [x] 8.1 สร้าง `api/admin/prompts.js` — อนุมัติ/ปฏิเสธ prompt
- [x] 8.2 สร้าง `api/admin/users.js` — จัดการ users
- [x] 8.3 สร้าง `api/admin/settings.js` — ตั้งค่า commission rate, เบอร์ TrueMoney

## Phase 9: Frontend — หน้า Marketplace ✅
- [x] 9.1 สร้าง `marketplace.html` — หน้ารวม prompt ทั้งหมด (grid, filter, search)
- [x] 9.2 สร้าง `prompt-detail.html` — หน้ารายละเอียด prompt + ซื้อ
- [x] 9.3 สร้าง `auth.html` — หน้า Login / Register
- [x] 9.4 สร้าง `dashboard.html` — Seller dashboard
- [x] 9.5 สร้าง `admin.html` — Admin panel
- [x] 9.6 สร้าง `topup.html` — หน้าเติมเครดิตด้วยอั่งเปา
- [x] 9.7 เพิ่มลิงก์ Marketplace ใน `index.html` เดิม
- [x] 9.8 สร้าง `js/marketplace.js` — Frontend logic ทั้งหมด
- [x] 9.9 สร้าง `css/marketplace.css` — Styling หน้า Marketplace

## Phase 10: Integration & Polish ✅
- [x] 10.1 เชื่อม index.html เดิม → "Marketplace" button ใน header
- [x] 10.2 Error handling + loading states ทุกหน้า
- [x] 10.3 Admin payout management API (`api/admin/payouts.js`)
- [x] 10.4 Complete TrueMoney flow with fallback error handling

---

## Tech Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Vanilla JS + CSS (ต่อยอดจากเดิม) |
| Backend API | Vercel Serverless Functions (Node.js) |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth (email + password) |
| Storage | Supabase Storage (รูปภาพ prompt) |
| Payment | TrueMoney อั่งเปา (unofficial API) |
| Hosting | Vercel |

## Environment Variables
```
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
TRUEMONEY_PHONE=09xxxxxxxx
JWT_SECRET=
```

## TrueMoney Redeem Flow
```
ลิงก์อั่งเปา → parse hash → เช็ค hash ซ้ำใน DB
→ POST https://gift.truemoney.com/campaign/vouchers/{hash}/redeem
→ Body: { mobile: OWNER_PHONE, voucher_hash: hash }
→ SUCCESS: เติม credit ตาม amount_baht
→ FAILED: แจ้ง error (NOT_FOUND / EXPIRED / REDEEMED)
```
