# RoV Pastel Top-up — starter project

เว็บไซต์ตัวอย่างสำหรับร้านเติมคูปอง RoV ธีม Cute Pastel Modern

## สิ่งที่มีในชุดเริ่มต้น
- หน้าแรกและหน้าเลือกแพ็กเกจ
- แบบฟอร์มข้อมูล UID / ชื่อในเกม / ช่องทางติดต่อ
- เลือก QR PromptPay หรือโอนธนาคาร
- หน้าเช็กสถานะคำสั่งซื้อและคิว
- หน้าติดต่อร้าน
- Responsive สำหรับมือถือ, iPad และคอมพิวเตอร์
- โครงสร้างฐานข้อมูล Supabase เบื้องต้น

## ตั้งค่า Supabase

1. ติดตั้ง Node.js รุ่น LTS และรัน `npm install`
2. คัดลอกไฟล์ `.env.example` เป็น `.env.local`
3. กรอกค่าจาก Supabase Project Settings → API:
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = Publishable key (หรือ anon key แบบเดิม)
4. รัน `npm run dev` แล้วเปิดเว็บตาม URL ที่ Vite แสดง
5. หาก deploy ผ่าน Vercel ให้เพิ่ม Environment Variables ชื่อเดียวกันใน Project Settings → Environment Variables แล้ว redeploy

ไฟล์ `.env.local` ถูก ignore โดย Git และไม่ควร commit ขึ้น repository

## ข้อควรทราบด้านความปลอดภัยและสถานะปัจจุบัน
- `src/lib/supabase.js` เตรียม Supabase client โดยอ่านค่าจาก Vite environment variables เท่านั้น
- Publishable/anon key ใช้ใน browser ได้เมื่อเปิด RLS และกำหนด policies อย่างถูกต้อง
- ห้ามใส่ service-role key, secret key หรือรหัสผ่านฐานข้อมูลใน frontend, GitHub หรือไฟล์ environment ที่ถูกเผยแพร่
- หากยังไม่ตั้งค่า environment เว็บไซต์จะอยู่ใน DEMO PREVIEW ข้อมูลตัวอย่างไม่ถูกบันทึกถาวร
- แม้เชื่อม Supabase client แล้ว การสร้าง/ค้นหาออเดอร์ยังไม่พร้อมใช้งานจริง: schema ตั้งใจไม่เปิด public insert/select บนตาราง orders แต่หน้าเว็บปัจจุบันยังเรียกตาราง orders โดยตรง จึงต้องเปลี่ยนไปใช้ Edge Functions ที่ตรวจสอบข้อมูลและสิทธิ์ก่อนเปิดรับออเดอร์
- เพิ่ม Edge Functions `create-order` และ `lookup-order` เพื่อไม่ให้หน้าเว็บเรียกตาราง `orders` โดยตรง โดยฝั่ง server อ่านราคาแพ็กเกจจาก `products` และส่งกลับเฉพาะข้อมูลอ้างอิง/สถานะที่จำเป็น
- ก่อนเปิดใช้ฟังก์ชัน ต้อง deploy migration `supabase/migrations/202611250001_seed_topup_products.sql` และ deploy Edge Functions ทั้งสองตัวไปยัง Supabase project เดียวกับเว็บไซต์
- ยังไม่ใช่ระบบรับชำระเงินจริง และยังไม่มีระบบอัปโหลด/ตรวจสอบสลิปหรือหน้าแอดมิน
- การออกหมายเลขคิวต้องทำฝั่ง server ใน transaction หรือ RPC เพื่อป้องกันเลขคิวซ้ำและการปลอมสถานะ
- เก็บ LINE channel access token และ service-role key ไว้ใน Edge Function secrets เท่านั้น
- LINE notifications ต้องมี LINE Official Account, Messaging API และการผูก userId ของลูกค้าก่อนส่ง push message ได้
- QR PromptPay, บัญชีธนาคาร, ราคาจริง, แพ็กเกจจริง และช่องทางติดต่อยังเป็นข้อมูล placeholder ต้องใส่จากหลังบ้านก่อนเปิดร้าน

## Deploy order functions to Supabase

หลังติดตั้ง Supabase CLI และ login แล้ว ให้รันจากโฟลเดอร์โปรเจกต์:

```bash
supabase link --project-ref hahjzoeooomutcczyptd
supabase db push
supabase functions deploy create-order
supabase functions deploy lookup-order
```

ฟังก์ชันใช้ `SUPABASE_URL` และ `SUPABASE_SERVICE_ROLE_KEY` ที่ Supabase จัดเตรียมให้ใน runtime ของ Edge Functions เท่านั้น ห้ามคัดลอก service role key ลง Vercel หรือ frontend

## โครงสร้าง
- `src/App.jsx` — หน้าร้านและหน้าติดตามคิว
- `src/styles.css` — ธีม pastel responsive
- `src/lib/supabase.js` — การเชื่อมต่อ Supabase
- `supabase/schema.sql` — โครงสร้างฐานข้อมูลเริ่มต้น

## งานที่ควรทำในเฟสถัดไป
1. สร้าง Edge Function สำหรับสร้างออเดอร์และค้นหาสถานะด้วยรหัสอ้างอิงที่ปลอดภัย
2. ระบบล็อกอินแอดมินและสิทธิ์ admin
3. หน้าหลังบ้านจัดการสินค้า/ราคา/ออเดอร์/คิว
4. Edge Function สำหรับอัปโหลดสลิปและอนุมัติการชำระเงิน
5. ฟังก์ชันอนุมัติสลิปและออกคิวอัตโนมัติ
6. ระบบเรียกคิวและอัปเดตสถานะผ่าน Realtime
7. LINE Messaging API ผ่าน Edge Function
8. ตั้งค่า Storage bucket แบบ private สำหรับสลิป พร้อม signed URL
