# Marketplace Redesign Plan — Tailwind CSS + Unified Role/Wallet

## Overview
รีดีไซน์ทุกหน้า Marketplace (ยกเว้น index.html) + ปรับระบบ role/wallet ให้เรียบง่าย

## Major Changes

### 1. Unified Role System
| เดิม | ใหม่ |
|------|------|
| 3 roles: buyer, seller, admin | **2 roles: user, admin** |
| ต้องเลือก buyer/seller ตอนสมัคร | ทุกคนซื้อ+ขายได้เลย |
| Seller dashboard แยก | **Dashboard เดียว** — ทุกคนเข้าถึง |
| ระบบถอนเงิน (payouts) | **ไม่ต้อง** — เครดิตหมุนเวียนในระบบ |

### 2. Unified Wallet
```
เติมเงิน 100 → ยอด 100
ซื้อ prompt 50 → ยอด 50 (ผู้ขายได้ 50 - ค่าคอม)
ขาย prompt ได้ 20 → ยอด 70
```

**Transaction Types:**
- `topup` — เติมเครดิตผ่าน TrueMoney อั่งเปา
- `purchase` — ซื้อ prompt (หักเงิน)
- `sale` — ขาย prompt (ได้เงินหลังหักค่าคอม)
- `commission` — ค่าคอมมิชชั่นที่ถูกหัก

### 3. Tailwind CSS Redesign
| Before | After |
|--------|-------|
| Custom CSS 1,136 lines | **Tailwind CSS CDN** + minimal custom |
| Bootstrap Icons | **Lucide Icons** |
| สี #6c5ce7 | **Indigo→Violet gradient** |

## Color Palette
- **Primary**: Indigo-600 (#4f46e5) → Violet-500 (#8b5cf6)
- **Accent**: Emerald-500 (#10b981) — success/balance
- **Warning**: Amber-500 (#f59e0b)
- **Danger**: Rose-500 (#f43f5e)
- **Background**: Slate-50 → White
- **Text**: Slate-900, Slate-600, Slate-400

## Navigation
| Device | Style |
|--------|-------|
| Desktop | Top navbar (glassmorphism, backdrop-blur) |
| Mobile | **Bottom navigation bar** (4-5 icons แบบ app) |

**Bottom menu items:**
1. 🏠 Marketplace
2. 📦 Orders
3. ➕ Create
4. 💰 Wallet (Top-up)
5. 👤 Profile

## Pages to Redesign

### marketplace.html
- Hero gradient + search กลาง
- Card grid: rounded-2xl, hover scale, shadow
- รองรับ `?seller={id}` แสดงเฉพาะ prompt ของ seller

### prompt-detail.html
- Image gallery + sticky sidebar (desktop)
- Review cards + purchase button

### auth.html
- Split layout (desktop: รูปซ้าย ฟอร์มขวา)
- **ไม่ต้องเลือก role** — สมัครแล้วเป็น user อัตโนมัติ

### dashboard.html (ทุกคนเข้าถึง)
- Stat cards (prompts, sales, revenue, balance)
- My Prompts table + สร้าง prompt ใหม่
- **ปุ่มคัดลอกลิงก์ร้านค้า** (`marketplace.html?seller={id}`)
- Transaction history (เห็นทุก type: เติม/ซื้อ/ขาย/ค่าคอม)
- Notifications

### admin.html
- Overview stats
- จัดการ Prompt (approve/reject)
- จัดการสมาชิก (user/admin)
- ตั้งค่า (commission rate, เบอร์ TrueMoney)
- **ไม่มีหน้าถอนเงินแล้ว**

### topup.html
- Balance card gradient
- Step-by-step guide
- Transaction history

### orders.html
- Order cards + download + review

### account.html
- Profile form + change password

## DB Changes
1. `users.role` — default 'user' แทน 'buyer'
2. Remove payout-related tables/functions (optional: keep for future)
3. `credits` table — unified transactions ทุก type
4. Remove `request_payout()` DB function

## API Changes
1. `auth/register` — ไม่ต้องรับ role (default: user)
2. `prompts/*` — ทุก user สร้าง/ขายได้
3. `credits/history` — แสดงทุก transaction type
4. Remove: `seller/payouts`, `admin/payouts`
5. `admin/users` — role เป็น user/admin เท่านั้น

## New Feature: Shop Link
- URL: `marketplace.html?seller={user_id}`
- แสดง seller info header + prompt ของคนนั้น
- ปุ่มคัดลอกลิงก์ใน dashboard

## Implementation Order
1. Update plan.md ✅
2. Update DB schema (unified role/wallet)
3. Update backend APIs
4. Redesign all HTML pages (Tailwind CSS)
5. Update marketplace.js (role system + Tailwind classes)
6. Rewrite marketplace.css (minimal)
7. Test & commit
