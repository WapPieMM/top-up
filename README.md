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

## ต้องตั้งค่าก่อนใช้งานจริง
1. ติดตั้ง Node.js รุ่น LTS บนคอมพิวเตอร์
2. แตกไฟล์ ZIP แล้วเปิดโฟลเดอร์โปรเจกต์
3. รัน `npm install`
4. คัดลอก `.env.example` เป็น `.env` แล้วใส่ Supabase Project URL และ anon key
5. เปิด Supabase SQL Editor แล้วรัน `supabase/schema.sql`
6. รัน `npm run dev` เพื่อดูหน้าเว็บ

## ข้อควรทราบสำคัญ
- หากยังไม่ตั้งค่า Supabase เว็บไซต์จะอยู่ใน DEMO PREVIEW ข้อมูลตัวอย่างไม่ถูกบันทึกถาวร
- ตัวอย่างนี้ยังไม่ใช่ระบบรับชำระเงินจริง และยังไม่เปิดให้ลูกค้าส่งออเดอร์เข้า database โดยตรง
- ก่อนเปิดใช้งานจริง ควรสร้าง Supabase Edge Functions สำหรับสร้างออเดอร์, อัปโหลดสลิป, ตรวจสอบสิทธิ์แอดมิน และอนุมัติการชำระเงิน
- การออกหมายเลขคิวต้องทำฝั่ง server ใน transaction หรือ RPC เพื่อป้องกันเลขคิวซ้ำและการปลอมสถานะ
- เก็บ LINE channel access token และ service-role key ไว้ใน Edge Function secrets เท่านั้น ห้ามใส่ในโค้ด frontend หรือไฟล์ `.env` ที่ถูกเผยแพร่
- LINE notifications ต้องมี LINE Official Account, Messaging API และการผูก userId ของลูกค้าก่อนส่ง push message ได้
- QR PromptPay, บัญชีธนาคาร, ราคาจริง, แพ็กเกจจริง และช่องทางติดต่อยังเป็นข้อมูล placeholder ต้องใส่จากหลังบ้านก่อนเปิดร้าน

## โครงสร้าง
- `src/App.jsx` — หน้าร้านและหน้าติดตามคิว
- `src/styles.css` — ธีม pastel responsive
- `src/lib/supabase.js` — การเชื่อมต่อ Supabase
- `supabase/schema.sql` — โครงสร้างฐานข้อมูลเริ่มต้น

## งานที่ควรทำในเฟสถัดไป
1. ระบบล็อกอินแอดมินและสิทธิ์ admin
2. หน้าหลังบ้านจัดการสินค้า/ราคา/ออเดอร์/คิว
3. Edge Function สำหรับสร้างออเดอร์และอัปโหลดสลิป
4. ฟังก์ชันอนุมัติสลิปและออกคิวอัตโนมัติ
5. ระบบเรียกคิวและอัปเดตสถานะผ่าน Realtime
6. LINE Messaging API ผ่าน Edge Function
7. ตั้งค่า Storage bucket แบบ private สำหรับสลิป พร้อม signed URL
