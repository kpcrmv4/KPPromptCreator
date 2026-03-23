# Marketplace Redesign Plan — Tailwind CSS + Modern UI

## Overview
รีดีไซน์ทุกหน้า Marketplace (ยกเว้น index.html หน้าสร้าง Prompt) ให้ทันสมัย สวยงาม responsive ด้วย Tailwind CSS + Lucide Icons

## Tech Changes
| Before | After |
|--------|-------|
| Custom CSS (marketplace.css 1,136 lines) | Tailwind CSS CDN + minimal custom CSS |
| Bootstrap Icons CDN | Lucide Icons CDN (สวยกว่า, lightweight) |
| สี #6c5ce7 (purple เดิม) | Gradient-based palette (Indigo → Violet) |

## Color Palette (Modern)
- **Primary**: Indigo-600 (#4f46e5) → Violet-500 (#8b5cf6) gradient
- **Accent**: Emerald-500 (#10b981) สำหรับ success/balance
- **Warning**: Amber-500 (#f59e0b)
- **Danger**: Rose-500 (#f43f5e)
- **Background**: Slate-50 (#f8fafc) → White
- **Text**: Slate-900, Slate-600, Slate-400
- **Cards**: White with subtle shadow + hover lift

## Pages to Redesign (8 pages)

### 1. Shared Components (ทุกหน้า)
- **Navbar**: Glassmorphism effect (backdrop-blur), gradient logo, modern dropdown menu
- **Mobile**: Slide-in sidebar menu (ไม่ใช่แค่ hamburger toggle)
- **Toast**: Slide-in from top-right with icon
- **Modal**: Backdrop blur, smooth animation
- **Loading**: Skeleton loader แทน spinner

### 2. marketplace.html — Prompt Browsing
- Hero section with gradient background + search bar กลาง
- Filter chips (pill-style) แทน select dropdowns
- Card grid: rounded-2xl, image aspect-ratio, hover scale effect
- Seller avatar + verified badge on cards
- Pagination: modern pill buttons

### 3. prompt-detail.html — Prompt Detail + Purchase
- Full-width image gallery (swipeable on mobile)
- Sticky sidebar with price + buy button (desktop)
- Review cards with avatar
- Related prompts section

### 4. auth.html — Login / Register
- Split layout (desktop: image left, form right)
- Floating labels, smooth transitions
- Social-style buttons
- Mobile: full-width form

### 5. dashboard.html — Seller Dashboard
- Sidebar navigation (desktop) / bottom tabs (mobile)
- Stat cards with gradient icons
- Modern data tables with status pills
- Drag-drop image upload zone
- **NEW**: Share link button — คัดลอกลิงก์ `marketplace.html?seller={id}` ให้ seller แชร์หน้าร้านตัวเอง

### 6. admin.html — Admin Panel
- Dark sidebar (desktop)
- Overview cards with sparkline-style stats
- Tabbed content with smooth transitions
- User management with avatar + role badges

### 7. topup.html — Top-up Credits
- Step-by-step visual guide
- Large balance card with gradient
- Transaction history with icons

### 8. orders.html — Purchase History
- Order cards (ไม่ใช่ table) with status badges
- Download button prominent
- Review inline

### 9. account.html — Profile Settings
- Avatar section
- Clean form layout
- Password strength indicator

## New Feature: Seller Shop Link
- URL: `marketplace.html?seller={user_id}`
- แสดงเฉพาะ prompt ของ seller คนนั้น
- มี header แสดงชื่อร้าน/seller info
- Seller กดปุ่ม "คัดลอกลิงก์ร้านค้า" ใน dashboard → copy URL to clipboard
- API: ใช้ GET /api/prompts?seller_id={id} (มีอยู่แล้ว)

## Implementation Order
1. Add Tailwind CSS CDN + Lucide Icons CDN to all pages
2. Redesign shared navbar + mobile menu
3. Redesign marketplace.html + seller filter support
4. Redesign prompt-detail.html
5. Redesign auth.html
6. Redesign dashboard.html + share link feature
7. Redesign admin.html
8. Redesign topup.html
9. Redesign orders.html
10. Redesign account.html
11. Rewrite marketplace.css (minimal custom styles only)
12. Update marketplace.js HTML generation to use Tailwind classes
