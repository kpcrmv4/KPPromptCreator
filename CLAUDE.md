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

## Phase 11: เพิ่มเติม — Storage, Edit Prompt, Admin Overview ✅
- [x] 11.1 เพิ่ม Supabase Storage Bucket (prompt-images, avatars) + Policies ใน SQL
- [x] 11.2 สร้าง `api/images/upload.js` — upload รูปตัวอย่าง prompt (base64, max 5 รูป, 5MB)
- [x] 11.3 สร้าง `api/images/delete.js` — ลบรูปตัวอย่าง
- [x] 11.4 Seller Dashboard: ปุ่มแก้ไข Prompt (edit modal: ชื่อ, ราคา, รายละเอียด, tags ฯลฯ)
- [x] 11.5 Seller Dashboard: Image Manager (อัปโหลด/ลบรูปตัวอย่าง)
- [x] 11.6 Admin Panel: Overview Stats (จำนวนสมาชิก, Prompt อนุมัติ, รออนุมัติ)
- [x] 11.7 Admin Panel: จัดการสมาชิก (เปลี่ยนสิทธิ์ buyer/seller/admin, ระงับ/เปิดใช้)
- [x] 11.8 Admin Panel: ตั้งค่าระบบ (commission rate, ถอนขั้นต่ำ, เบอร์ TrueMoney, ชื่อเว็บ)

## Phase 12: Notifications + Payout Proof + Seller History ✅
- [x] 12.1 DB: เพิ่มตาราง `notifications` (type, title, message, ref_id, is_read)
- [x] 12.2 DB: เพิ่ม `payouts.proof_image_url` สำหรับหลักฐานการโอน
- [x] 12.3 DB: เพิ่ม Storage bucket `payout-proofs` + policies
- [x] 12.4 สร้าง `lib/notify.js` — helper ส่ง notification ให้ user/admins
- [x] 12.5 สร้าง `api/notifications/index.js` — GET (ดู) / PUT (อ่านแล้ว)
- [x] 12.6 แก้ `api/seller/payouts.js` — seller กดถอน → แจ้ง admin ทุกคนทันที
- [x] 12.7 แก้ `api/admin/payouts.js` — admin แนบรูปหลักฐานโอน + บันทึก transaction + แจ้ง seller
- [x] 12.8 Seller Dashboard: เพิ่มประวัติรายรับจากการขาย (ตาราง)
- [x] 12.9 Seller Dashboard: เพิ่มประวัติการถอนเงิน + สถานะ + ดูหลักฐานโอน
- [x] 12.10 Seller Dashboard: เพิ่มแจ้งเตือน (ถอนสำเร็จ/ปฏิเสธ)
- [x] 12.11 Admin Panel: เพิ่มแจ้งเตือน (คำขอถอนเงินใหม่)
- [x] 12.12 Admin Panel: ช่องแนบรูปหลักฐานโอนเงินก่อนกดอนุมัติ

## Flow การถอนเงิน (สมบูรณ์)
```
Seller กดถอนเงิน (ระบุจำนวน + เบอร์ TrueMoney)
       ↓
ระบบหักเครดิต Seller + สร้าง payout (pending)
       ↓
ส่ง notification แจ้ง Admin ทุกคน
       ↓
Admin เห็นในหน้า Admin Panel
       ↓
Admin โอนเงินผ่าน TrueMoney Wallet จริง
       ↓
Admin แนบรูปหลักฐาน + หมายเหตุ → กดอนุมัติ
       ↓
ระบบบันทึก proof_image_url + transaction
       ↓
ส่ง notification แจ้ง Seller "ถอนเงินสำเร็จ"
       ↓
Seller เห็นในประวัติการถอน + ดูรูปหลักฐานได้
```

## Phase 13: Gap Analysis Fixes ✅ (Vercel + Supabase Best Practices)
- [x] 13.1 **CRITICAL**: Atomic purchase via DB function `purchase_prompt()` (SELECT FOR UPDATE, ป้องกัน race condition)
- [x] 13.2 **CRITICAL**: Atomic payout via DB function `request_payout()` (ป้องกัน double submit)
- [x] 13.3 **CRITICAL**: สร้าง `orders.html` — หน้าประวัติคำสั่งซื้อ (buyer) + ปุ่มดาวน์โหลด
- [x] 13.4 **CRITICAL**: สร้าง `account.html` — หน้าตั้งค่าบัญชี + เปลี่ยนรหัสผ่าน
- [x] 13.5 สร้าง `api/auth/update-profile.js` — แก้ชื่อ/bio + เปลี่ยนรหัสผ่าน
- [x] 13.6 **HIGH**: เพิ่ม notification เมื่อ admin approve/reject prompt → แจ้ง seller
- [x] 13.7 **HIGH**: เพิ่ม notification เมื่อมีคนซื้อ prompt → แจ้ง seller
- [x] 13.8 **HIGH**: แสดงรูปตัวอย่างใน prompt-detail.html (image gallery)
- [x] 13.9 **HIGH**: Admin prompt tabs (pending/approved/rejected) — ดู prompt ทุกสถานะ
- [x] 13.10 **HIGH**: Settings validation backend (commission 0-100%, phone format, etc.)
- [x] 13.11 **HIGH**: Responsive hamburger menu ทุกหน้า (auto-inject via JS)
- [x] 13.12 **HIGH**: Responsive table (horizontal scroll on mobile)
- [x] 13.13 **HIGH**: Responsive modal, toast, detail page, stats cards
- [x] 13.14 เพิ่มลิงก์ orders + account ใน navbar
