# FAQ — สำหรับลูกค้า KP GAS Builder

> รวมคำถามที่พบบ่อย — ใช้ใน FAQ modal ใน wizard + หน้า landing + LINE auto-reply
> Last updated: 2026-05-25

---

## 🤔 ทำไมต้องเลือก Mode A หรือ Mode B?

ระบบของเรามี 2 แบบ:

**Mode A — Pure GAS** (เริ่ม ฿499 · ไม่มีค่ารายปี)
- ระบบทั้งหมดอยู่ใน Google Drive ของคุณ
- ใช้ฟรีตลอดชีพ ไม่ต้องจ่ายรายปี
- UI พื้นฐาน เหมาะกับใช้ภายในทีม

**Mode B — Hybrid (Vercel + GAS)** (เริ่ม ฿499 · ฿300/ปี ตั้งแต่ปีที่ 2)
- หน้าเว็บอยู่บน Vercel ของเรา (UI สวย ทันสมัย)
- ฐานข้อมูลอยู่ใน Google Drive ของคุณ
- รองรับ: กล้อง, barcode, PWA, login ภายนอก, AI

ระบบเลือกให้อัตโนมัติตาม feature ที่คุณต้องการ — ถ้าจำเป็นต้องใช้ Mode B จะมี warning เด้งแจ้ง

---

## 🔐 OAuth คืออะไร? ปลอดภัยไหม?

OAuth = Google ขอความยินยอมจากคุณก่อนให้แอปอื่นเข้าถึงข้อมูล เป็นมาตรฐานความปลอดภัยของ Google เอง

**สิทธิ์ที่เราขอ:**
- `drive.file` — เห็น**เฉพาะ**ไฟล์ที่แอปเราสร้าง (ไม่เห็นไฟล์อื่นใน Drive)
- `script.projects` — สร้าง+จัดการ Apps Script project ที่เราสร้าง
- `script.deployments` — deploy script เป็น Web App

**สิ่งที่เราจะไม่ทำ:**
- ❌ อ่านไฟล์อื่นใน Drive
- ❌ ลบไฟล์ที่เราไม่ได้สร้าง
- ❌ เก็บ token ของคุณเกิน 24 ชม.
- ❌ ส่งข้อมูลออกนอกระบบเรา

**Token Lifecycle:**
หลัง deploy เสร็จ เราลบ token ทิ้งทันทีภายใน 24 ชม.

**Revoke ได้ตลอด:**
https://myaccount.google.com/permissions

---

## 🏠 ระบบของฉันอยู่ที่ไหน?

**Mode A:**
- ทุกอย่างอยู่ใน Google Drive ของคุณ
- เปิด apps.script.google.com → เห็น script project ของคุณ
- เปิด drive.google.com → เห็น Sheet ของคุณ

**Mode B:**
- หน้าเว็บอยู่บน Vercel ของเรา (ใช้ URL `{slug}.vercel.app`)
- Sheet อยู่ใน Drive ของคุณ
- Apps Script ก็อยู่ใน Drive ของคุณ

---

## 💔 ถ้าเลิกบริการ KP ระบบของฉันจะเป็นยังไง?

**Mode A:** ไม่กระทบเลย
- ทุกอย่างอยู่ใน Google Drive ของคุณ
- คุณเปิด apps.script.google.com → ใช้งาน + แก้ไขเองได้ตลอด
- ไม่ต้อง depend กับเรา

**Mode B:** ต้อง migrate
- Vercel project = ของเรา
- ถ้าเราเลิกบริการ คุณยังมี Sheet + GAS code อยู่ใน Drive
- เราสามารถส่งโค้ด frontend ให้คุณ deploy บน Vercel/Netlify ของคุณเองได้
- ค่าบริการ migrate: ฿1,000 (โอน + setup)

---

## 🔄 Update / เพิ่ม feature ในอนาคตทำยังไง?

**Mode A · Done-For-You:**
- คุณคลิก link → authorize อีกครั้ง (30 วินาที)
- เราเปลี่ยน version + redeploy ให้

**Mode A · DIY:**
- คุณ copy code ใหม่ที่เราส่งให้
- Paste ใน Apps Script Editor → save → deploy
- ใช้เวลา 5-10 นาที (มี video สอน)

**Mode B:**
- เรา push code ใหม่ → Vercel redeploy auto
- คุณไม่ต้องทำอะไร

**เพิ่ม feature ใหม่:**
- สั่ง upgrade order ใหม่ — คิดราคาเฉพาะส่วนต่าง
- เช่น มี LINE Push แล้ว อยากเพิ่ม Charts = +฿500

---

## 🚫 ถ้าฉันเลือก DIY แล้วทำไม่ได้?

ส่งข้อความหาเราใน LINE — เราจะช่วย:
1. **Free support:** Screen share สั้นๆ 10 นาที (ครั้งแรกฟรี)
2. **Upgrade to Done-For-You:** ไม่ต้องจ่ายเพิ่ม (เพราะราคาเท่ากัน) — แค่บอกเรา เราจะ deploy ให้

---

## 💰 ค่ารายปี ฿0 จริงเหรอ (Mode A)?

**จริง 100%** — เพราะ Google host ฟรีตลอดชีพให้ Apps Script Web App

- ระบบของคุณรันบน Google infrastructure → ไม่มี server cost
- Sheet ของคุณ → Google ฟรี (ภายใน 15GB free)
- ไม่มี hidden fee

**Mode B มีค่ารายปี ฿300:** เพราะเรา host Vercel ให้คุณ ค่ารายปีเริ่มจ่ายปีที่ 2 (ปีแรกฟรี)

---

## 🌐 Domain ของฉันใช้ได้ไหม?

**Mode A:** ใช้ Apps Script URL (`script.google.com/macros/s/{id}/exec`) — ใช้ custom domain ไม่ได้

**Mode B:** ใช้ได้ทั้ง 2 แบบ:
- Default: `{slug}.vercel.app` (ฟรี)
- Custom domain: +฿300/ปี (ค่าบริการตั้ง DNS + SSL — ไม่รวมค่าจดโดเมน)

---

## 📞 ทำไมไม่จ่ายเงินในเว็บได้เลย?

เราเลือกคุยใน LINE ก่อน เพราะ:
- ✓ คุณคุยรายละเอียดเพิ่มเติมได้
- ✓ เราเช็ค scope ก่อนรับเงิน — ไม่อยากให้คุณจ่ายแล้วงงทีหลัง
- ✓ ส่ง PromptPay QR ง่ายกว่าผ่าน LINE
- ✓ ติดตามสถานะได้ใน thread เดียว
- ✓ ตอบไวกว่า (เรา notify ทันที)

**Flow:**
1. กด "ยืนยันคำสั่งซื้อ" → ได้รหัส `ORDER-XXXXXX`
2. Add LINE @kpgas → ส่งข้อความ (เรากรอกให้แล้ว)
3. เรา reply ภายใน 30 นาที + ส่ง PromptPay QR
4. โอนเงิน + ส่งสลิป → เริ่มผลิตทันที

---

## ⏱ ส่งมอบเมื่อไหร่?

- **Starter (฿499-799):** ภายใน 1-2 วันทำการ
- **Standard (฿800-1,500):** ภายใน 2-3 วันทำการ
- **Pro (฿1,501+):** ภายใน 3-5 วันทำการ

นับจากวันที่ยืนยันชำระเงิน (ใน LINE)

---

## 🛟 Support หลังส่งมอบครอบคลุมอะไร?

**รวมในราคา (ปีแรก):**
- Bug fix ของ code เรา ภายใน 7 วันแรก
- Email/LINE support ตอบใน 3 วันทำการ
- Dependency security update (Mode B)
- คำถามเรื่องการใช้งาน

**คิดเงินเพิ่ม:**
- เพิ่ม feature ใหม่
- Redesign UI
- Migrate data
- 1-on-1 training
- เปลี่ยน scope จากเดิม
- Fix ที่เกิดจาก user (เช่น เผลอลบคอลัมน์ใน Sheet)

---

## ❌ ขอ refund ได้ไหม?

| สถานะ | นโยบาย |
|---|---|
| ยังไม่จ่าย (submitted) | ยกเลิกได้ฟรี — แจ้งใน LINE |
| จ่ายแล้ว · ยังไม่เริ่มผลิต | คืน 100% |
| กำลังผลิต | คืน 50% (เพราะคุยกับ AI + spec แล้ว) |
| ส่งมอบแล้ว · ใช้งานไม่ได้ตามสเปก | คืน 100% + troubleshoot ภายใน 7 วัน |
| ส่งมอบแล้ว · ใช้งานได้ตามสเปก | ไม่คืน |

---

## 🤖 AI Chat ใน wizard เก็บข้อมูลฉันไหม?

- **ข้อมูลที่ AI เห็น:** เฉพาะที่คุณพิมพ์ใน chat เพื่อ design ระบบ
- **เก็บที่ไหน:** Supabase ของเรา (เข้ารหัส)
- **ใช้ทำอะไร:** เพื่อ generate spec ให้ team developer สร้างระบบ
- **ลบเมื่อไหร่:** เก็บไว้ตลอดอายุของ project (สำหรับ reference)
- **ไม่ขายต่อ:** เราไม่ขาย/แชร์ chat log ของคุณกับ third party

---

## 📊 ฉันใช้ AI feature (เช่น AI chat) ในระบบ ต้องจ่ายเพิ่มไหม?

**Build cost:** ฿800-1,500 (จ่ายครั้งเดียว)

**Recurring cost:** **คุณจ่ายเอง** ตรงให้กับ Anthropic/OpenAI
- ไม่ผ่านเรา (เราไม่ต้องการ markup token)
- คุณ control budget เอง
- โดยเฉลี่ย ~฿200-1,000/เดือน ขึ้นกับ usage

**เหตุผล:** ถ้าเรา host token = บางลูกค้า heavy user จะทำให้เราขาดทุน ทุกคนต้องจ่ายเฉลี่ยกัน

---

## 🔧 ฉันแก้ code เองได้ไหม?

**Mode A:**
- ได้! เปิด apps.script.google.com → editor → แก้ → save → re-deploy
- มี video สอนพื้นฐาน
- ถ้าแก้แล้วพัง — เรา restore ให้ ฿500/ครั้ง

**Mode B:**
- ส่งคำขอ source code transfer ฿1,500-3,000 → เราโอน repo ให้
- คุณ deploy เอง + แก้เองทั้งหมด

---

## 🆘 ถ้าระบบพังกะทันหันต้องทำยังไง?

1. ส่งข้อความใน LINE OA (เปิด 9:00-21:00)
2. ถ้าด่วน — กดปุ่ม "🆘 ระบบพัง" ใน Rich Menu (response priority)
3. เราเช็คให้ภายใน 2 ชม. (ในเวลาทำการ)

**ระบบพังที่ไม่นับเป็น bug ของเรา:**
- Google Workspace ของคุณถูกระงับ
- Sheet ถูก rename / delete / permission เปลี่ยน
- Quota เกิน (เช่น GAS execution time limit)

---

## 🎁 มี promo / ส่วนลดไหม?

- **First order:** -10% สำหรับลูกค้าใหม่ (code: `FIRST10`)
- **Bundle order:** สั่ง 3 ระบบ = -฿500 รวม
- **Referral:** แนะนำเพื่อน → คุณได้ ฿200 / เพื่อนได้ -10%

ส่ง code ใน LINE ตอนยืนยันยอด

---

## 🏢 รับงานใหญ่กว่านี้ไหม?

งบ ฿3,000+ ไม่เข้า template ปกติ → คุยเป็น project base

ทักใน LINE บอก:
- ขอบเขตคร่าวๆ
- จำนวน user
- ต้องการ deadline เมื่อไหร่

เราจะประเมินและส่ง quote กลับ

---

## 📞 ติดต่อ

**LINE OA:** @kpgas
**Email:** support@kpgas.app (placeholder — เปลี่ยนตามจริง)
**เวลาทำการ:** 9:00 - 21:00 (จ-อา · เวลาไทย)
**Response time:** 30 นาที (เวลาทำการ) · 3 ชม. (นอกเวลา)
