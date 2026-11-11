# RegMeUp

ระบบลงทะเบียนกิจกรรมอบรมและเวิร์กช็อปภายในมหาวิทยาลัย สำหรับวิชา CPE334 วิศวกรรมซอฟต์แวร์

Branch foundation เตรียมโครงสร้าง client/server ฐานข้อมูลและเครื่องมือทดสอบ ยังไม่ได้พัฒนา login, กิจกรรม หรือการลงทะเบียน ดู [เอกสาร](docs/README.md), [SYS-01](docs/sprints/sprint-1/sys-01.md) และ [UI baseline](docs/ui-spec.md)

## เตรียมเครื่อง

- Node.js **22.23.4** และ npm **10.9.9**; `.nvmrc` ระบุ Node เป้าหมาย
- PostgreSQL **17.11** สองฐานข้อมูลแยกสำหรับแอปและทดสอบ พร้อมสิทธิ์จัดการ schema ของฐานข้อมูลที่กำหนด
- ใช้ข้อมูลสังเคราะห์เท่านั้น และไม่ commit รหัสผ่านหรือไฟล์ `.env`

ติดตั้งจาก root ของ repository:

```powershell
node --version
npm --version
npm ci
Copy-Item server/.env.example server/.env
```

กำหนด `DATABASE_URL`, `TEST_DATABASE_URL`, `SESSION_SECRET` และ `APP_ORIGIN` ใน `server/.env` ให้ตรงกับเครื่อง ฐานข้อมูล app/test ต้องเป็นคนละฐานข้อมูลจริง; session secret ต้องมีอย่างน้อย 32 ตัวอักษร ห้ามใช้ production credentials ข้อมูลใน `.env.example` เป็นเพียง placeholder

## ฐานข้อมูลและ seed

สร้างฐานข้อมูลและบัญชีตามวิธีติดตั้ง PostgreSQL ของทีมก่อน คำสั่ง migration ใช้ `DATABASE_URL` ที่ระบุใน `server/.env` โดยไม่ reset ฐานข้อมูล:

```powershell
npm run db:generate
npm run db:migrate
```

Seed เป็นคำสั่งแยก และปฏิเสธ `NODE_ENV=production` ใช้รหัสผ่านสำหรับบัญชีสังเคราะห์ที่กำหนดเองใน environment เท่านั้น บัญชี `p1`, `p2`, `p3`, `o1`, `o2` ใช้โดเมน `example.test`:

```powershell
$env:ALLOW_SYNTHETIC_SEED = '1'
$env:SEED_PASSWORD = 'replace-with-a-synthetic-local-password'
npm run db:seed
Remove-Item Env:ALLOW_SYNTHETIC_SEED, Env:SEED_PASSWORD
```

Seed ใช้ fixture IDs คงที่ ไม่ reset ฐานข้อมูล และไม่เปลี่ยนรายการที่มี ID เดิมเมื่อรันซ้ำ จึงควรใช้กับฐานข้อมูลสำหรับ local/test ที่จัดเตรียมไว้เท่านั้น

## รันและตรวจ

เปิดสอง terminal จาก root:

```powershell
npm run dev:server
```

```powershell
npm run dev:client
```

Frontend อยู่ที่ `http://localhost:5173` และ Vite ส่ง `/api` ไป server ที่ `http://localhost:3000`; `/api/health` ตอบ 200 เมื่อเชื่อมฐานข้อมูลได้และ 503 เมื่อไม่ได้ ปัจจุบันยังไม่มี domain endpoints

```powershell
npm run typecheck
npm run build
npm run test:unit
```

## Integration tests

ต้องใช้ PostgreSQL แยกสองฐานข้อมูลจริงบน server endpoint เดียวกัน: `DATABASE_URL` สำหรับแอป และ `TEST_DATABASE_URL` สำหรับทดสอบ ตัวตรวจจะอ่าน effective database/server identity จากการเชื่อมต่อทั้งคู่ ไม่ใช้การเทียบ URL string อย่างเดียว และปฏิเสธเมื่อ endpoint ต่างกันหรือพิสูจน์ไม่ได้ว่าเป็นคนละฐานข้อมูล

เตรียม test DB แบบว่างที่ตรวจสอบชื่อและปลายทางด้วยตนเองแล้ว ใช้ `DATABASE_URL` ชี้ test DB ชั่วคราวเพื่อรัน `npm run db:migrate` และ `npm run db:seed` จากนั้นสร้างตาราง marker **เฉพาะใน test DB ที่ยืนยันแล้ว** ด้วย `psql` หรือเครื่องมือจัดการฐานข้อมูล:

```sql
CREATE TABLE regmeup_test_guard (marker text PRIMARY KEY CHECK (marker = 'regmeup-isolated-test'));
INSERT INTO regmeup_test_guard VALUES ('regmeup-isolated-test');
```

ตั้ง `DATABASE_URL` กลับไปที่ฐานข้อมูลแอป และกำหนด `TEST_DATABASE_URL` กับ `SEED_PASSWORD` ที่ใช้ seed test DB ใน shell ก่อนรัน:

```powershell
npm run test:integration
```

Integration tests ปฏิเสธเมื่อไม่มี URL หรือ marker/ตัวตนฐานข้อมูลไม่ผ่าน guard; การทดสอบ constraint ใช้ transaction แล้ว rollback ไม่เปิด HTTP reset endpoint และโปรเจกต์ยังไม่มีคำสั่ง reset อัตโนมัติ ห้ามใช้ `prisma migrate reset` หรือ `migrate dev` กับฐานข้อมูลแอป/production ที่มีข้อมูลต้องเก็บไว้

## ขอบเขตการตรวจ

SYS-01 มี acceptance/test design ใน [contract](docs/sprints/sprint-1/sys-01.md) ผลการตรวจจริงและข้อจำกัดต้องบันทึกใน PR; การตรวจ foundation ไม่ใช่ผลทดสอบ F-01–F-04 หรือ TEST-13 ทั้งระบบ Playwright tooling เตรียมไว้ แต่ยังไม่มี E2E domain journey ใน branch นี้
