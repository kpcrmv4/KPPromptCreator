# Migration Plan — Marketplace → GAS Builder

> Safe step-by-step migration ของ codebase + DB + storage + 3rd-party setup
> Last updated: 2026-05-25 (v2 — เพิ่ม Phase A0 OAuth + Phase L LINE OA + LINE-first checkout)

---

## 1. Strategy

ใช้ **branch-and-replace** ไม่ใช่ in-place delete:

1. สร้าง branch `feat/gas-pivot`
2. ทำงานบน branch จนเสร็จ + test ครบ
3. Merge เข้า main + deploy
4. หลัง deploy 1 สัปดาห์โดยไม่มี issue → ลบไฟล์ marketplace จริง

ระหว่าง branch ยังไม่ merge → production main ยังเป็น marketplace ปกติ

---

## 2. Phase Breakdown (overview)

| Phase | Title | เวลาประมาณ |
|---|---|---|
| **A0** | Google OAuth Consent Verification (เริ่มแต่เนิ่นๆ) | 7-14 วันรอ Google |
| **A** | Prep + backup | 1 วัน |
| **L** | LINE OA setup + Messaging API | 1 วัน |
| **B** | DB Migration | 1 วัน |
| **C** | Backend cleanup + API new | 2 วัน |
| **D** | Frontend cleanup + wizard build | 2-3 วัน |
| **E** | Smoke test | 1 วัน |
| **F** | Deploy | ½ วัน |
| **G** | Build Pipeline (เฟส 2) | 1-2 สัปดาห์ |
| **H** | Cleanup post-deploy | 1 สัปดาห์ |

---

## 3. Phase A0 — Google OAuth Consent Verification

> **เริ่มก่อนสุด** เพราะใช้เวลา 7-14 วันรอ Google review
> ทำคู่ขนานกับ Phase A-F ได้
> ถ้าไม่ verify → Mode A · Done-For-You จะแสดง "Unverified app" warning → conversion ลด

- [ ] A0.1 Google Cloud Console → APIs & Services → OAuth consent screen
- [ ] A0.2 Configure:
  - App name: KP GAS Builder
  - User support email: support@kpgas.app
  - App logo (512x512 PNG)
  - App home page: https://kpgas.app
  - Privacy policy: https://kpgas.app/privacy
  - Terms of service: https://kpgas.app/terms
  - Authorized domains: kpgas.app
- [ ] A0.3 Scopes:
  - `https://www.googleapis.com/auth/drive.file` (เห็นเฉพาะไฟล์ที่ app สร้าง)
  - `https://www.googleapis.com/auth/script.projects` (create + manage script)
  - `https://www.googleapis.com/auth/script.deployments` (deploy as web app)
  - + scope justification (อธิบายว่าใช้ทำอะไร)
- [ ] A0.4 อัด demo video 2-3 นาที (Google บังคับ):
  - แสดง flow: order → click OAuth link → grant → see deployed system
- [ ] A0.5 Submit for verification
- [ ] A0.6 รอ Google review (Plan B ใน Phase F: เปิด DIY mode only ระหว่างรอ)

**ระหว่างรอ verify:**
- Test mode = limit 100 users (ทำ trial / friends-and-family ได้)
- Production users เห็น "Unverified app" warning — workaround: คลิก "Advanced → Continue"
- Document workaround ใน FAQ ถ้า user ติด

---

## 4. Phase A — Prep

- [ ] A1. Backup production DB (ผ่าน Supabase Studio → Database → Backup)
- [ ] A2. Snapshot list_tables ปัจจุบัน → save `docs/snapshots/2026-05-25-tables.json`
- [ ] A3. สร้าง branch `feat/gas-pivot`
- [ ] A4. Confirm pricing catalog ใน `BUSINESS-MODEL.md` (lock ไม่ให้แก้ระหว่าง dev)
- [ ] A5. Confirm scope: marketplace=ลบ, course/topup/prompt creator=เก็บ

---

## 5. Phase L — LINE OA Setup

ทำคู่ขนานกับ Phase A0/B/C

- [ ] L1. ถ้ายังไม่มี: สมัคร LINE Official Account
  - https://www.linebiz.com/th/entry/
  - เลือก Premium ID (`@kpgas`) ฿2,200/ปี ถ้าอยากชื่อสวย หรือ Basic ID ฟรี
- [ ] L2. Verify เบอร์โทร + อัปโลโก้/cover
- [ ] L3. LINE Developers Console → Create Provider → Create Messaging API Channel
  - Link กับ LINE OA ที่สร้าง
- [ ] L4. Get + save in `.env`:
  - `LINE_OA_BASIC_ID` (`@kpgas`)
  - `LINE_CHANNEL_ID`
  - `LINE_CHANNEL_SECRET`
  - `LINE_CHANNEL_ACCESS_TOKEN` (long-lived — issue ใน Console)
  - `LINE_WEBHOOK_SECRET`
- [ ] L5. ตั้ง webhook URL = `https://kpgas.app/api/line/webhook` (ในขั้นนี้ยังไม่ต้อง implement)
- [ ] L6. Save QR ของ OA ลง `images/line-oa-qr.png` (ใช้ใน success page)
- [ ] L7. ดู `docs/LINE-INTEGRATION-GUIDE.md` สำหรับ template ข้อความ Welcome, FAQ, etc.
- [ ] L8. ตั้ง Rich Menu ด้านล่าง:
  - [สถานะออเดอร์] [คู่มือ] [ติดต่อ admin] [โปรโมชั่น]
- [ ] L9. Get ADMIN_LINE_USER_IDS — admin add OA + reply 1 ข้อความ → ดึง userId จาก webhook log
- [ ] L10. Test: ส่ง LINE Push จาก postman ไปยัง admin → ต้องเข้า

---

## 6. Phase B — DB Migration

apply ตามลำดับใน `SCHEMA-CHANGES.md` § 2

- [ ] B1. Apply `20260525_drop_marketplace.sql`
- [ ] B2. Verify (`SCHEMA-CHANGES.md` § 8.1)
- [ ] B3. Apply `20260525_extend_codegen_to_gas.sql`
- [ ] B4. Verify § 8.2 + 8.5
- [ ] B5. Apply `20260525_add_gas_builder_tables.sql`
- [ ] B6. Verify § 8.3 + 8.4
- [ ] B7. Apply `20260525_update_notifications_enum.sql`
- [ ] B8. Insert settings ใหม่ (§ 7 ใน SCHEMA-CHANGES.md)
- [ ] B9. Insert seed data templates (§ 9)
- [ ] B10. Run advisors → ไม่มี new WARN
  ```
  mcp__claude_ai_Supabase__get_advisors type=security
  mcp__claude_ai_Supabase__get_advisors type=performance
  ```
- [ ] B11. Setup pg_cron job ล้าง expired OAuth tokens (รายชั่วโมง)
  ```sql
  SELECT cron.schedule('cleanup_oauth_tokens', '0 * * * *',
    $$DELETE FROM customer_oauth_tokens WHERE expires_at < NOW() OR used_at IS NOT NULL$$);
  ```

---

## 7. Phase C — Backend Cleanup + New APIs

**ลบ files:**
- [ ] C1. Delete `api/prompts/` ทั้ง folder
- [ ] C2. Delete `api/reviews/`
- [ ] C3. Delete `api/orders/` (marketplace — ระวังอย่าลบ `codegen-orders`)
- [ ] C4. Delete `api/seller/` (ถ้ามี)
- [ ] C5. Delete `api/admin/prompts.js`, `api/admin/payouts.js`
- [ ] C6. grep + remove `commission_rate` references

**ปรับ files:**
- [ ] C7. `api/codegen-orders/` → ตรวจให้ใช้ table `gas_orders` (rename DB จะ auto-resolve แต่ให้แก้ var ใน code ด้วย)
- [ ] C8. `api/codegen-orders/index.js`:
  - เพิ่ม fields: `template_code`, `mode`, `delivery_method`, `addons`, `style`, `chat_log`, `spec_json`, `customer_name`, `customer_email`, `line_basic_id`
  - **ลบ slip image requirement** (slip ส่งทาง LINE แทน)
  - เพิ่ม generate `order_number`
  - Status default = `'submitted'` (ไม่ใช่ `'pending_payment'`)
  - Notify admin via LINE Push (ไม่ใช่ web notification เดิม)
- [ ] C9. `lib/notify.js`:
  - เพิ่ม `lineNotifyAdmin({ orderNumber, total, template })` function
  - เพิ่ม `linePushUser({ userId, type, data })` function
  - ใช้ Messaging API endpoint `https://api.line.me/v2/bot/message/push`
- [ ] C10. `lib/auth.js` — ตรวจไม่มี logic seller/buyer

**สร้าง new files:**
- [ ] C11. `api/gas-templates/index.js` (GET list)
- [ ] C12. `api/gas-templates/[code].js` (GET detail + preview links)
- [ ] C13. `api/gas-orders/quote.js` (POST: คำนวณ + Mode A/B detect)
- [ ] C14. `api/gas-orders/[id]/chat.js` (POST: AI conversation streaming)
- [ ] C15. `api/gas-orders/[id]/spec.js` (POST: generate prompt.md)
- [ ] C16. `api/admin/gas-orders/queue.js` (GET: list by status)
- [ ] C17. `api/admin/gas-orders/[id]/mark-paid.js` (POST: manual paid after LINE verify)
- [ ] C18. `api/admin/gas-orders/[id]/start-build.js` (POST: 4 paths)
- [ ] C19. `api/admin/gas-orders/[id]/deploy.js` (POST: Mode A/B specific)
- [ ] C20. `api/admin/gas-orders/[id]/oauth-link.js` (POST: gen signed OAuth URL for customer)
- [ ] C21. `api/oauth/install.js` (GET: redirect to Google consent screen)
- [ ] C22. `api/oauth/callback.js` (GET: store token + trigger deploy)
- [ ] C23. `api/customer-projects/index.js` (GET: my projects + renewal status)
- [ ] C24. `api/customer-projects/[id]/reauth.js` (GET: re-authorize for update)
- [ ] C25. `api/line/webhook.js` (POST: receive LINE events — สำหรับ chatbot future)
- [ ] C26. `api/line/push.js` (POST: internal — admin tool ส่ง LINE)

**Helpers:**
- [ ] C27. `lib/line.js`:
  - `pushMessage(userId, messages)`
  - `replyMessage(replyToken, messages)`
  - `verifySignature(body, signature)`
  - `buildLineMessageUrl(oaId, prefilledText)`
- [ ] C28. `lib/google-oauth.js`:
  - `buildConsentUrl({state, scopes})`
  - `exchangeCode(code) → {access_token, refresh_token}`
  - `refreshAccessToken(refresh_token)`
  - `revokeToken(token)`
- [ ] C29. `lib/apps-script-api.js`:
  - `createProject({title, oauthToken})`
  - `updateContent({scriptId, files, oauthToken})`
  - `createVersion({scriptId, description, oauthToken})`
  - `createDeployment({scriptId, versionNumber, oauthToken})`
- [ ] C30. `lib/vercel-api.js` (สำหรับ Mode B):
  - `createProject({name, gitRepository})`
  - `updateEnvVars({projectId, env})`
  - `triggerDeploy({projectId})`
- [ ] C31. `lib/github-api.js`:
  - `createRepoFromTemplate({template, name})`
  - `cloneRepo({repo, dest})`

---

## 8. Phase D — Frontend Cleanup + Wizard Build

**ลบ HTML/JS/CSS:**
- [ ] D1. Delete `marketplace.html`
- [ ] D2. Delete `prompt-detail.html`
- [ ] D3. Delete `js/marketplace.js`, `js/mp-core.js`, `js/mp-dashboard.js`, `js/mp-pages.js`
- [ ] D4. Delete `css/marketplace.css` (ตรวจ dependency ก่อน)

**ปรับ existing pages:**
- [ ] D5. `index.html` — ลบ Marketplace link, เพิ่ม "สั่งสร้างระบบ GAS" CTA hero
- [ ] D6. `dashboard.html`:
  - ลบ My Prompts / Sales / Shop link sections
  - เพิ่ม "My GAS Projects" (table จาก `customer_projects`)
  - เพิ่ม "My Orders" (status table จาก `gas_orders`)
- [ ] D7. `admin.html`:
  - ลบ tabs: prompts approval, payouts
  - เพิ่ม tabs: GAS Orders Queue, Customer Projects, Templates, LINE Inbox
- [ ] D8. `orders.html` → change source = `gas_orders`
- [ ] D9. Bottom nav + sidebar — ลบ marketplace icon, เพิ่ม "สั่งสร้าง" icon

**Upsell hook ใน prompt creator:**
- [ ] D10. `js/save-prompt.js` หลัง save:
  - ถ้า platform = google-apps-script หรือ keyword match → show modal
  - "อยากให้เราสร้างเป็นระบบจริงให้ไหม?"
  - confirm → `gas-builder.html?from=prompt&promptId={id}`

**สร้าง new pages:**
- [ ] D11. `gas-builder.html` — wizard 5+1 steps
- [ ] D12. `js/gas-builder.js`:
  - Step navigation
  - Pricing engine + Mode A/B detect
  - AI chat (streaming)
  - Live preview iframe
  - Auto-save draft ทุก 30 วินาที
- [ ] D13. `css/gas-builder.css` (ใช้ Tailwind CDN)
- [ ] D14. `gas-builder-success.html` — LINE OA QR + prefilled message
- [ ] D15. `customer-projects.html`
- [ ] D16. `admin-gas-orders.html`:
  - Queue table
  - Filter by status
  - Spec viewer modal
  - "Mark Paid" button
  - "Start Build" button → 4 paths
  - "Deploy" button
- [ ] D17. `oauth-install.html` — landing ที่ลูกค้าเห็นก่อน Google consent
  - อธิบาย scope ที่ขอ + ความปลอดภัย
  - ปุ่ม "ดำเนินการต่อ" → redirect Google OAuth

---

## 9. Phase E — Smoke Test (local)

- [ ] E1. Auth: login/register/logout ✓
- [ ] E2. Prompt creator: save prompt → save ลง `saved_prompts` ✓
- [ ] E3. Upsell modal: เด้งถูกต้องเฉพาะ GAS/web prompts
- [ ] E4. GAS builder Step 1: เลือก template → state save
- [ ] E5. Step 2: เปลี่ยน color/font → preview update
- [ ] E6. Step 3: toggle add-on → ราคา update + Mode detect ถูก
- [ ] E7. AI chat: ส่ง message → ได้ reply + spec generate
- [ ] E8. Force Mode B modal: toggle camera → เด้ง warning
- [ ] E9. Step 4: preview iframe โหลด + quote ครบ
- [ ] E10. Step 4.5: delivery method radio + ราคาเปลี่ยน
- [ ] E11. Step 5: submit → success page + LINE QR + prefilled message URL ทำงาน
- [ ] E12. Admin: เห็น order ใหม่ใน queue
- [ ] E13. Admin click "Mark Paid" → status เปลี่ยน + LINE push test
- [ ] E14. Course: เข้า course หน้าได้ปกติ (regression)
- [ ] E15. Topup: เติมเครดิตได้ปกติ (regression)
- [ ] E16. Mobile responsive: 320/375/768 ทุกหน้าใหม่
- [ ] E17. Dark mode toggle (ถ้ามี)
- [ ] E18. grep `marketplace|prompts/purchase|reviews|seller_id` = เหลือเฉพาะ comment

---

## 10. Phase F — Deploy

- [ ] F1. Merge `feat/gas-pivot` → `main`
- [ ] F2. Vercel auto-deploy run
- [ ] F3. Smoke test บน production URL
- [ ] F4. Set redirect: `/marketplace.html` → `/gas-builder.html`
- [ ] F5. Set redirect: `/prompt-detail.html?id=*` → `/gas-builder.html`
- [ ] F6. ประกาศ:
  - LINE OA broadcast: "🎉 บริการใหม่ — สั่งสร้างระบบ GAS"
  - Email to existing users
  - Banner ใน index.html

**Plan B ถ้า OAuth verification (Phase A0) ยังไม่ผ่าน:**
- เปิดเฉพาะ `mode-a-diy` + `mode-b-self-setup` + `mode-b-setup-service`
- ปิด `mode-a-done-for-you` ในชั่วคราว (hide ใน Step 4.5)
- เมื่อ verify ผ่าน → flip flag → เปิดให้ใช้

---

## 11. Phase G — Build Pipeline (เฟส 2)

หลัง Phase F live แล้ว ค่อยทำ pipeline (ระหว่างที่ pipeline ยังไม่พร้อม — admin deliver manual)

- [ ] G1. Setup local workspace `GAS_BUILD_WORKSPACE=F:/kpgas-workspace`
- [ ] G2. สร้าง `kpgas/templates` repo + 9 templates เริ่มต้น (มี mode-a/ และ mode-b/ subfolder ทุกอัน ยกเว้น camera-required = mode-b only)
- [ ] G3. Vercel API integration ทดสอบ
- [ ] G4. Apps Script API + service account ทดสอบ
- [ ] G5. Implement `start-build.js` ทั้ง 4 paths
- [ ] G6. Implement `deploy.js` ทั้ง 2 modes
- [ ] G7. End-to-end test: order ใหม่ → Mode A DIY → ส่ง zip → ✓
- [ ] G8. End-to-end test: Mode A Done-For-You → OAuth deploy → ✓
- [ ] G9. End-to-end test: Mode B Self-setup → deploy → ✓

---

## 12. Phase H — Cleanup (post-deploy)

- [ ] H1. Vercel logs ตรวจ 1 สัปดาห์ → ไม่มี error เกี่ยวกับ marketplace
- [ ] H2. ลูกค้าไม่ complain
- [ ] H3. Drop backup ของ marketplace data
- [ ] H4. Update README.md + CLAUDE.md (ลบ marketplace section)
- [ ] H5. Archive `plan.md` → `docs/archive/plan-marketplace-2026.md`
- [ ] H6. Dump `supabase/schema.sql` ใหม่ → sync กับ live DB

---

## 13. File-by-file Action Table

### Delete
| File | Phase |
|---|---|
| `marketplace.html` | D1 |
| `prompt-detail.html` | D2 |
| `js/marketplace.js` | D3 |
| `js/mp-core.js` | D3 |
| `js/mp-dashboard.js` | D3 |
| `js/mp-pages.js` | D3 |
| `css/marketplace.css` | D4 |
| `api/prompts/*` | C1 |
| `api/reviews/*` | C2 |
| `api/orders/*` (เก่า) | C3 |
| `api/seller/*` (ถ้ามี) | C4 |
| `api/admin/prompts.js` | C5 |
| `api/admin/payouts.js` | C5 |

### Edit
| File | Action | Phase |
|---|---|---|
| `index.html` | nav + hero CTA | D5 |
| `dashboard.html` | sections | D6 |
| `admin.html` | tabs | D7 |
| `orders.html` | source | D8 |
| `js/save-prompt.js` | upsell hook | D10 |
| `api/codegen-orders/index.js` | new fields + ลบ slip required | C8 |
| `lib/notify.js` | LINE push helpers | C9 |
| `lib/auth.js` | regression check | C10 |

### Create
| File | Phase |
|---|---|
| `gas-builder.html` | D11 |
| `js/gas-builder.js` | D12 |
| `css/gas-builder.css` | D13 |
| `gas-builder-success.html` | D14 |
| `customer-projects.html` | D15 |
| `admin-gas-orders.html` | D16 |
| `oauth-install.html` | D17 |
| `api/gas-templates/index.js` | C11 |
| `api/gas-templates/[code].js` | C12 |
| `api/gas-orders/quote.js` | C13 |
| `api/gas-orders/[id]/chat.js` | C14 |
| `api/gas-orders/[id]/spec.js` | C15 |
| `api/admin/gas-orders/queue.js` | C16 |
| `api/admin/gas-orders/[id]/mark-paid.js` | C17 |
| `api/admin/gas-orders/[id]/start-build.js` | C18 |
| `api/admin/gas-orders/[id]/deploy.js` | C19 |
| `api/admin/gas-orders/[id]/oauth-link.js` | C20 |
| `api/oauth/install.js` | C21 |
| `api/oauth/callback.js` | C22 |
| `api/customer-projects/index.js` | C23 |
| `api/customer-projects/[id]/reauth.js` | C24 |
| `api/line/webhook.js` | C25 |
| `api/line/push.js` | C26 |
| `lib/line.js` | C27 |
| `lib/google-oauth.js` | C28 |
| `lib/apps-script-api.js` | C29 |
| `lib/vercel-api.js` | C30 (Phase G) |
| `lib/github-api.js` | C31 (Phase G) |
| `supabase/migrations/20260525_drop_marketplace.sql` | B1 |
| `supabase/migrations/20260525_extend_codegen_to_gas.sql` | B3 |
| `supabase/migrations/20260525_add_gas_builder_tables.sql` | B5 |
| `supabase/migrations/20260525_update_notifications_enum.sql` | B7 |

### Keep as-is
- `course-*.html`, `course-content/`, `course-templates/`, `lessons/`, `enrollments/`
- `topup.html`, `auth.html`, `account.html` (regression check)
- `api/auth/*`, `api/credits/*`, `api/topup/*`, `api/admin/users.js`, `api/admin/settings.js`
- `api/courses/*`, `api/course-orders/*`, `api/enrollments/*`, `api/lessons/*`
- `api/codegen-orders/*`, `api/gas-codegen/*` (extend ใน C7-C8)
- `js/app.js`, `js/save-prompt.js` (+upsell hook), `js/gas-mode.js`
- `api/collections/*`, `api/saved-prompts/*`
- `api/notifications/*`

---

## 14. Rollback Strategy

### Rollback Phase B (DB)
ดู `SCHEMA-CHANGES.md` § 10

### Rollback Phase C-D (Code)
```bash
git checkout main
git branch -D feat/gas-pivot
```
หรือถ้า merge แล้ว → `git revert <merge_commit>`

### Rollback Phase F (Production)
Vercel dashboard → Deployments → previous → "Promote to Production"

### Rollback Phase A0 (OAuth verification)
ไม่ต้อง rollback — แค่ disable Mode A · Done-For-You ในเว็บ (feature flag)

### Rollback Phase L (LINE)
Disable LINE-related features ใน admin panel → fallback to email-only contact

---

## 15. Communication Plan

| When | Channel | Message |
|---|---|---|
| Day -7 | LINE OA + email | "ปรับปรุงระบบ — เปลี่ยน Marketplace เป็นบริการสั่งสร้าง" |
| Day -1 | LINE OA | "พรุ่งนี้เปิดบริการใหม่!" |
| Day 0 | Banner index.html + LINE broadcast | "🎉 บริการใหม่: สั่งสร้างระบบ GAS เริ่ม ฿499" |
| Day +3 | Email | กรณีศึกษา + ตัวอย่างระบบ |
| Day +7 | LINE OA | follow-up: ใครยังไม่ได้สั่ง? promo code |

---

## 16. Definition of Done

- [ ] Phase A0-H ทุก task ✓
- [ ] Live URL: `https://kpgas.app/gas-builder.html` ใช้งานได้
- [ ] สั่ง order ทดสอบครบ flow:
  - เลือก template → AI chat → choose delivery → submit
  - → success page LINE QR + click Add Friend → LINE app เปิด พร้อม message
  - → admin เห็น order + ดู spec
  - → admin mark paid → LINE Push เข้าลูกค้า
- [ ] ทดสอบ Mode A · Done-For-You: คลิก OAuth link → grant → ระบบ deploy ใน Drive
- [ ] ทดสอบ Mode B: code + push → Vercel deploy → URL ใช้งานได้
- [ ] ไม่มี broken link (link checker)
- [ ] Lighthouse score หน้าใหม่ ≥ 80 ทุกหมวด
- [ ] Mobile responsive 320/375/768
- [ ] ไม่มี new advisor WARN
- [ ] grep marketplace = 0 references (เหลือเฉพาะ comment historical)
- [ ] OAuth Consent verified (หรือ flagged disabled ถ้ายังไม่ผ่าน)
- [ ] LINE OA pushd messages ทดสอบทั้ง 5 types สำเร็จ
