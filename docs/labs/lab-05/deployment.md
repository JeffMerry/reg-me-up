# Lab 5 — RegMeUp deployment

สถานะ: **ฉบับเริ่มต้น / อยู่ระหว่าง setup** อัปเดตล่าสุด 14 พฤศจิกายน 2026 จาก branch `build/lab5-docker` และ [PR #16](https://github.com/JeffMerry/reg-me-up/pull/16) ซึ่งยังรอ review ณ เวลาบันทึก ผล Docker ในเอกสารนี้เป็นการทดสอบในเครื่อง; **ยังไม่ยืนยัน GCP deployment, CI/CD หรือ clean-clone check**

เอกสารนี้เขียนหลังเริ่มทำ Docker แล้ว เนื่องจากพบข้อกำหนดไฟล์จาก handout ภายหลัง ไม่อ้างว่าไฟล์ฉบับนี้มีอยู่ก่อนทำ Docker ให้อัปเดตเมื่อทีมตั้งค่าและทดสอบแต่ละส่วนจริง

## 1. Stack และแนวทาง deployment

| ส่วน | เทคโนโลยี / แนวทาง |
|---|---|
| Frontend | React 19, TypeScript, Vite และ Tailwind CSS; build เป็น static files |
| Backend API | Node.js 22.23.4, npm 10.9.9, Express 5 และ TypeScript; Prisma Client/Prisma ORM |
| Database และ session | PostgreSQL 17.11 สำหรับ local Compose; server เก็บ session ด้วย `connect-pg-simple` ในตาราง `sessions` |
| Migration | Prisma Migrate 7.10.1 ผ่าน `npm run db:migrate` ซึ่งตรวจ migration history ก่อน deploy |
| Container | [Dockerfile](../../../Dockerfile) สร้าง frontend และ backend ด้วย npm workspaces แล้วเสิร์ฟ UI และ API จาก image เดียว/ origin เดียว; [compose.yaml](../../../compose.yaml) มี PostgreSQL, migration และ app profile สำหรับเครื่องพัฒนา |
| GCP — แผน | Cloud Run รัน image, Artifact Registry เก็บ image, Cloud SQL for PostgreSQL เก็บข้อมูล, Secret Manager เก็บค่าลับ; ชื่อและการตั้งค่าจริง **TBD** |
| CI/CD | [CI and Docker Build](../../../.github/workflows/ci-docker.yml) กำหนดตรวจ PR เข้า `lab5-staging`/`main`; run แรกบน PR เข้า staging ผ่านแล้วตาม [หลักฐาน](ci-evidence.md). PR เข้า main และการบังคับ required check **รอตรวจจริง**. Deploy จาก `main` และ Workload Identity Federation ยังเป็นแผน **TBD** |

บริการ GCP ที่วางแผนไว้ตรงกับ reference stack; การสร้างและเลือกค่าจริงยังไม่ยืนยัน ความต่างจากตัวอย่าง TokTickIT คือ RegMeUp ใช้ Node 22 และ PostgreSQL 17.11 ใน local แทนเวอร์ชันของตัวอย่าง, ใช้ npm workspaces และ image เดียวสำหรับ local app กับ Cloud ที่วางแผนไว้ เพื่อให้ frontend/API ใช้ origin เดียว และคง migration-history guard กับ synthetic seed ที่ห้าม production ของ RegMeUp ไว้ การเลือก PostgreSQL version บน Cloud SQL และการเชื่อมต่อ **TBD** ไม่อ้างว่าตรงกับ local โดยอัตโนมัติ

## 2. Environment variables

ชื่อ runtime/seed/demo ตรงกับ [server/.env.example](../../../server/.env.example); ตัวแปร Compose, Vite และ browser tests แสดงเพิ่มเพื่อให้ setup ได้ครบ ห้ามนำค่าจริงของ secret หรือ connection string ลง Git, รายงาน, screenshot หรือ chat ชื่อ Secret Manager ด้านล่างเป็น **TBD** จนสร้างจริง

| Variable | ใช้ทำอะไร | จำเป็นเมื่อใด / ค่าเริ่มต้น | Secret | ค่ามาจากไหน |
|---|---|---|---|---|
| `NODE_ENV` | เลือกโหมดและกำหนด Secure cookie; seed ปฏิเสธ production | ค่าเริ่มต้น `development`; image ระบุ `production`; local Compose app ใช้ `development` | No | ผู้รัน / image / Cloud Run |
| `PORT` | port ที่ backend รับ request | ค่าเริ่มต้น `3000`; Cloud Run กำหนดตอนรัน | No | ผู้รัน / Cloud Run |
| `DATABASE_URL` | เชื่อม PostgreSQL สำหรับ API, Prisma, migration และ seed | จำเป็นสำหรับ server/migration/seed/demo | **Yes** | local จาก `server/.env` หรือ Compose; Cloud จาก Secret Manager ชื่อ **TBD** |
| `SESSION_SECRET` | ลงนาม session cookie | จำเป็นสำหรับ server; อย่างน้อย 32 ตัวอักษร | **Yes** | local ผู้รันกำหนด; Cloud จาก Secret Manager ชื่อ **TBD** |
| `APP_ORIGIN` | origin ที่อนุญาตในการตรวจ CSRF | จำเป็นสำหรับ server; ต้องเป็น origin ตรงกับ URL ของ browser ไม่มี path/trailing slash | No | local `server/.env` / Compose; Cloud Run config **TBD** |
| `TRUST_PROXY_HOPS` | ให้ Express เชื่อถือ forwarded headers จาก proxy | ปกติไม่ตั้ง; ตั้ง `1` ได้เฉพาะ production หลัง proxy หนึ่งชั้นที่เชื่อถือได้ | No | Cloud Run config **TBD** หลังตรวจ topology และจำกัด direct access |
| `FRONTEND_DIR` | path ของ frontend build ที่ Express เสิร์ฟ | ไม่จำเป็นสำหรับ local Vite; image ตั้ง `/app/client/dist` | No | Docker image / ผู้รัน |
| `TEST_DATABASE_URL` | ระบุฐานข้อมูล integration/E2E แบบแยก | จำเป็นเมื่อรัน test ที่ใช้ฐานข้อมูล; ต้องแยกจาก app DB และมี test marker | **Yes** | ผู้ทดสอบกำหนดจาก test environment; ไม่ใช้เป็น production app DB |
| `ALLOW_SYNTHETIC_SEED` | เปิดการสร้าง local/test fixtures | จำเป็นเป็น `1` เมื่อใช้ synthetic seed; ห้าม seed นี้ใน production | No | ผู้รันในเครื่อง / CI ทดสอบ |
| `SEED_PASSWORD` | รหัสผ่านสังเคราะห์ของ local/test seed และบาง integration/E2E tests | จำเป็นเมื่อ seed หรือรัน test ที่อาศัย fixtures; ใช้ค่าเดิมที่ seed ครั้งแรก | **Yes** | ผู้ทดสอบกำหนดเป็นข้อมูลสังเคราะห์เฉพาะเครื่อง/test |
| `ALLOW_DEMO_PROVISION` | เปิดคำสั่งสร้างบัญชี demo | ต้องเป็น `1` เฉพาะเวลารัน provisioning ที่ได้รับอนุญาต | No | ผู้รัน job แบบครั้งเดียว |
| `DEMO_EXPECTED_DATABASE` | ยืนยันชื่อฐานข้อมูลที่เชื่อมต่อก่อนสร้างบัญชี demo | จำเป็นเมื่อ provisioning; ชื่ออย่างเดียวไม่ยืนยันว่า target ปลอดภัย | No | ผู้รันตรวจจากฐานข้อมูล demo ที่ทีมอนุมัติ |
| `DEMO_PARTICIPANT_PASSWORD` | รหัสผ่านบัญชี demo Participant | จำเป็นเมื่อ provisioning; 16–1024 bytes และต่างจาก Organizer | **Yes** | secret สำหรับ job; ชื่อ Secret Manager **TBD** |
| `DEMO_ORGANIZER_PASSWORD` | รหัสผ่านบัญชี demo Organizer | จำเป็นเมื่อ provisioning; 16–1024 bytes และต่างจาก Participant | **Yes** | secret สำหรับ job; ชื่อ Secret Manager **TBD** |
| `REGMEUP_API_PROXY_TARGET` | Vite dev proxy ส่ง `/api` ไป backend | ไม่จำเป็น; ค่าเริ่มต้น `http://localhost:3000` | No | ผู้รัน / `client/.env.local`; ไม่ใช่ runtime Cloud |
| `REGMEUP_PG_PORT` | host port ของ PostgreSQL ใน Compose | ไม่จำเป็น; `55432` | No | shell/Compose local |
| `REGMEUP_WEB_PORT` | host port ของ Compose app | ไม่จำเป็น; `5173`; เปลี่ยน `REGMEUP_APP_ORIGIN` ให้ตรงกัน | No | shell/Compose local |
| `REGMEUP_APP_ORIGIN` | ค่า `APP_ORIGIN` ที่ส่งให้ Compose app | ไม่จำเป็น; `http://localhost:5173` | No | shell/Compose local |
| `REGMEUP_DOCKER_SESSION_SECRET` | ส่ง `SESSION_SECRET` ให้ Compose app | ไม่จำเป็นเฉพาะ local; Compose มี fallback สาธารณะสำหรับ local เท่านั้น | **Yes** เมื่อกำหนดจริง | shell/Compose; ห้ามใช้ fallback กับ Cloud |
| `E2E_APP_DATABASE_URL` | ระบุ app DB เพื่อตรวจว่า E2E test DB แยกจริง | จำเป็นสำหรับ Playwright tests | **Yes** | ผู้ทดสอบกำหนดจาก test environment |
| `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` | เลือก Chromium executable ที่ติดตั้งไว้ | ไม่จำเป็น; ปกติใช้ browser ที่ Playwright จัดการ | No | ผู้ทดสอบ / CI |
| `CI_PG_PORT`, `CI_PG_CONTAINER` | port และ container ID ของ PostgreSQL service สำหรับ CI | เฉพาะ CI setup; มาจาก `job.services.postgres` | No | GitHub Actions service context; ไม่ใช้กับ Cloud app |
| `GITHUB_ENV`, `GITHUB_SHA`, `GITHUB_STEP_SUMMARY` | ส่งค่าระหว่าง CI steps, ระบุ commit ที่ runner ตรวจ และเขียนสรุป | GitHub Actions กำหนดอัตโนมัติใน workflow | No | GitHub Actions runner |
| `LAB5_SMOKE_BASE_URL` | origin ของแอปสำหรับ local Docker smoke test | จำเป็นสำหรับ `scripts/lab5-docker-smoke.cjs`; รับเฉพาะ HTTP localhost | No | ผู้ทดสอบกำหนดให้ตรงกับพอร์ต Compose แยก |
| `LAB5_SMOKE_CONFIRM` | ยืนยันว่าผู้รันเลือกเป้าหมาย local ที่แยกเพื่อทดสอบ | ต้องเป็น `isolated-local-only` เมื่อรัน smoke test | No | ผู้ทดสอบตั้งใน shell หลังตรวจ project/DB |
| `LAB5_SMOKE_RECORD_PATH` | ที่เก็บ ID ของกิจกรรมและทะเบียนสังเคราะห์สำหรับตรวจหลัง restart | จำเป็นสำหรับ smoke test ทั้ง `create` และ `verify` | No | ผู้ทดสอบตั้ง path ของไฟล์ชั่วคราวในเครื่อง |

## 3. Build, test และ run จาก clean clone

คำสั่งด้านล่างเป็น PowerShell บน Windows และรันจาก **root ของ repository** เว้นแต่ระบุอย่างอื่น ต้องมี Git, Node.js **22.23.4**, npm **10.9.9**, Docker Desktop ที่ใช้ Linux containers และ Docker Compose หากรัน browser tests ต้องติดตั้ง Playwright Chromium ด้วย อย่าใช้ฐานข้อมูลที่มีข้อมูลจริงสำหรับ fixtures หรือ tests

**สถานะ:** clean clone ของ commit `a231b89149eefd2a90be86557e0ff9ec6e86e267` ผ่านการติดตั้ง, migrate/seed, build/test และตรวจ UI/API/DB ใน Compose project แยกโดย Codex เมื่อ 14 พฤศจิกายน 2026; ดู [ผลและคำสั่ง](../../sprints/sprint-1/lab5-docker-evidence.md) การรันซ้ำโดยสมาชิกอีกคนยังไม่ทดสอบ และ Cloud ยังไม่ทดสอบ

```powershell
git clone https://github.com/JeffMerry/reg-me-up.git
cd reg-me-up
git switch build/lab5-docker  # PR #16; หลัง merge ให้ใช้ lab5-staging ที่มีงานนี้
node --version
npm --version
npm ci
Copy-Item server/.env.example server/.env
```

แก้ `server/.env` ในเครื่อง: ตั้ง `SESSION_SECRET` แบบสุ่มอย่างน้อย 32 ตัวอักษรและตรวจค่าฐานข้อมูล local ตามตัวอย่าง; ไม่ commit ไฟล์นี้ หรือเปิดเผยค่าใน logs ทั้ง `DATABASE_URL` และ `TEST_DATABASE_URL` ต้องชี้ไปยังฐานข้อมูล local **คนละชื่อบน server เดียวกัน** ตาม test guard

เริ่ม PostgreSQL และเตรียม application DB (ทุกคำสั่งจาก root):

```powershell
docker compose up -d --wait
npm run db:generate
npm run db:migrate
```

สำหรับบัญชีตัวอย่าง local ให้ผู้รันตั้ง `SEED_PASSWORD` เป็นรหัสผ่านสังเคราะห์ผ่านช่องทางที่ไม่เผยค่าก่อน แล้วรัน:

```powershell
if (-not $env:SEED_PASSWORD) { throw 'Set a synthetic SEED_PASSWORD privately first' }
$env:ALLOW_SYNTHETIC_SEED = '1'
npm run db:seed
Remove-Item Env:ALLOW_SYNTHETIC_SEED
```

สร้าง test DB เฉพาะบน Compose volume ใหม่: script ของ PostgreSQL จะสร้าง `regmeup_test` เมื่อเริ่ม volume ครั้งแรกเท่านั้น ตรวจว่า `server/.env` ชี้ app DB และ test DB คนละฐาน และกำหนด `SEED_PASSWORD` สังเคราะห์เป็นค่าเดียวกับที่ใช้ seed test DB ใช้ **PowerShell terminal ใหม่** เพื่อไม่ให้ค่าทดสอบกระทบ shell รันแอป:

```powershell
# โหลดเฉพาะค่าฐานข้อมูลจากไฟล์ local เข้าสู่ environment โดยไม่แสดงค่า
Get-Content server/.env | ForEach-Object {
  if ($_ -match '^(DATABASE_URL|TEST_DATABASE_URL)=(.*)$') {
    [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process')
  }
}
if (-not $env:DATABASE_URL -or -not $env:TEST_DATABASE_URL -or -not $env:SEED_PASSWORD) {
  throw 'Set both local database URLs and a synthetic SEED_PASSWORD first'
}
$lab5AppDatabaseUrl = $env:DATABASE_URL
$env:DATABASE_URL = $env:TEST_DATABASE_URL
$env:ALLOW_SYNTHETIC_SEED = '1'
npm run db:migrate
npm run db:seed
# ติดตั้ง marker หลัง migration ครั้งแรก เฉพาะ regmeup_test ของ Compose local
Get-Content -Raw docker/postgres/enable-test-guard.sql | docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test
$env:DATABASE_URL = $lab5AppDatabaseUrl
npm run test:integration
```

ก่อนติดตั้ง marker ต้องตรวจด้วยตนเองว่า test URL ชี้ `regmeup_test` บน Compose local จริง คำสั่ง marker ระบุชื่อฐานข้อมูลนั้นโดยตรง ถ้าเปลี่ยนชื่อฐานข้อมูลต้องปรับคำสั่งให้ตรง และห้ามใช้กับ DB จริง การเรียก integration test ตรวจ live database identities และ marker ก่อนเขียนข้อมูล ไม่ใช้ `prisma migrate reset` กับ DB ที่ต้องเก็บข้อมูล

```powershell
npm run test:unit
npm run typecheck
npm run build
```

Browser tests ใช้ terminal ที่ตั้งค่าฐานข้อมูลทดสอบแล้ว: กำหนด `$env:E2E_APP_DATABASE_URL = $lab5AppDatabaseUrl`, `$env:DATABASE_URL = $env:TEST_DATABASE_URL`, `$env:NODE_ENV = 'test'` และตั้ง `SESSION_SECRET` สังเคราะห์อย่างน้อย 32 ตัวอักษรใน environment; คง `SEED_PASSWORD` ที่ใช้ seed test DB แล้วรัน:

```powershell
npx playwright install chromium
npx playwright test
```

Playwright เริ่ม server เฉพาะที่ port 43170 และ Vite ที่ 43171; รายละเอียดและข้อกำหนด test DB อยู่ใน [e2e/README.md](../../../e2e/README.md) หลังจบให้ปิด terminal ทดสอบหรือลบตัวแปรที่ตั้งไว้ ไม่ใช้ terminal นี้รันแอปปกติ

รันแอปโดยตรงในสอง terminal จาก root: `npm run dev:server` และ `npm run dev:client`; เปิด `http://localhost:5173` โดย Vite proxy `/api` ไป backend `localhost:3000`

หรือ build image และรัน frontend/API/PostgreSQL ด้วย Compose:

```powershell
docker build -t regmeup:local .
docker compose --profile app up --build -d --wait
docker compose --profile app ps -a
```

เปิด `http://localhost:5173`, `http://localhost:5173/api/health` และ `http://localhost:5173/api/ready`; health/readiness ควรตอบ `200` เมื่อ DB พร้อม และ `503` เมื่อ DB ไม่พร้อม Profile นี้ใช้ image ที่ Compose build เอง; `docker build -t` เป็นการตรวจ build แยก ไม่ได้ทำให้ Compose ใช้ tag นั้นโดยอัตโนมัติ

หากต้องใช้ local fixtures ใน Compose ให้ตั้ง `SEED_PASSWORD` สังเคราะห์ใน environment ก่อน แล้วรันจาก root:

```powershell
docker compose --profile app run --rm -e NODE_ENV=development -e ALLOW_SYNTHETIC_SEED=1 -e SEED_PASSWORD migrate npm run db:seed
```

Compose ไม่ seed อัตโนมัติ; คำสั่งนี้เขียนลง local `regmeup_dev` ที่ service `postgres` เท่านั้น หยุดโดยคง volume ด้วย `docker compose --profile app stop` ไม่ใช้ `down -v` กับข้อมูลที่ต้องเก็บ

## 4. Database migration และ seed

| งาน | คำสั่งจาก root | เวลาและผู้รัน |
|---|---|---|
| สร้าง Prisma Client | `npm run db:generate` | หลังติดตั้ง dependency หรือเปลี่ยน schema |
| Migration | `npm run db:migrate` | local: ผู้พัฒนารันหลัง DB พร้อม; Compose `migrate` service รันก่อน app และตรวจ history/checksum; Cloud: **TBD** ว่า job ใดรันก่อน release และยังไม่ทดสอบ |
| Synthetic seed | `npm run db:seed` | รันแยกหลัง migration เฉพาะ local/test โดยตั้ง `ALLOW_SYNTHETIC_SEED=1` และ `SEED_PASSWORD`; ปฏิเสธ `NODE_ENV=production` |
| Demo/UAT provisioning | `npm run db:provision-demo` | เสนอให้ผู้ได้รับอนุญาตรันครั้งเดียวเฉพาะ DB demo ที่แยกจริง พร้อม variables ใน §2; cloud job, การส่ง secrets และผู้รับผิดชอบ **TBD / ยังไม่ทดสอบ** |

Synthetic seed สร้าง Participant 3 บัญชี, Organizer 2 บัญชี และกิจกรรม/ทะเบียนสังเคราะห์แบบ ID คงที่ รันซ้ำไม่ลบข้อมูลหรือเปลี่ยนรายการที่มี ID เดิม และไม่เปลี่ยนรหัสผ่านเดิม Demo provisioning สร้าง Participant/Organizer อย่างละหนึ่งบัญชีเมื่อไม่มีรายการเดิม รันซ้ำแล้วไม่เปลี่ยนรหัสผ่าน และยกเลิก transaction เมื่อ ID/email/role ชนกัน ตรวจชื่อ DB เป็นเพียง safeguard; ผู้รันต้องยืนยัน project และ DB ที่ตั้งใจใช้ก่อนทุกครั้ง

## 5. GCP project และ resources

ผู้ใช้แจ้งว่าเตรียมบัญชี/Project และ Budget แล้ว แต่ยังไม่ได้ตรวจชื่อหรือค่าจาก GCP ในรอบเขียนเอกสาร จึงไม่ใส่ค่าที่คาดเดา

| รายการ | ชื่อ / ค่าที่ใช้ | หน้าที่ |
|---|---|---|
| Project ID | **TBD — รอยืนยัน** | GCP Project ของทีม |
| Region | **TBD — รอยืนยัน** | พื้นที่ deploy และจัดเก็บทรัพยากร |
| App service | **TBD — ยังไม่ยืนยัน** | Cloud Run service |
| Image registry / repository | **TBD — ยังไม่ยืนยัน** | Artifact Registry |
| Database instance / database | **TBD — ยังไม่ยืนยัน** | Cloud SQL PostgreSQL และฐานข้อมูลที่ใช้จริง |
| Secret names | **TBD — ยังไม่สร้าง/ยืนยัน** | ชื่อ secrets สำหรับ database, session และ demo ตามที่ใช้จริง; ไม่ใส่ค่า |
| Runtime/deployer service accounts | **TBD — ยังไม่ยืนยัน** | ตัวตนของแอปและ pipeline |
| Migration job | **TBD — ยังไม่ยืนยัน** | รัน migration ก่อน release หากทีมเลือกวิธีนี้ |
| Workload Identity provider / GitHub environment | **TBD — ยังไม่ยืนยัน** | ยืนยันตัวตน pipeline โดยไม่ใช้ key file |
| Public URL | **TBD — ยังไม่ deploy** | URL สำหรับใช้งานและตรวจระบบ |

## 6. Release procedure และ commit ที่กำลังรัน

เส้นทางที่ทีมเลือก: `Issue → feature/fix branch จาก lab5-staging → PR เข้า lab5-staging → เพื่อน review + CI ผ่าน → merge → release PR lab5-staging → main → เพื่อน review + CI ผ่าน → merge → deploy จาก main` ผู้เขียนไม่ approve PR ของตนเอง; ติด label งาน Lab 5 และบันทึกหลักฐานจริงตาม handout

1. สร้าง Issue และ branch จาก `lab5-staging` ล่าสุด ทำการเปลี่ยนแปลงพร้อม tests แล้วเปิด PR เข้า staging
2. งาน [#20](https://github.com/JeffMerry/reg-me-up/issues/20): workflow `CI and Docker Build` job `test-and-docker` กำหนดให้รันใน PR เข้า `lab5-staging` และ `main` รวม install, migrations/seed ใน DB ชั่วคราว, unit/integration/Playwright, typecheck/build และ Docker build พร้อม `workflow_call`. GitHub แสดง check `test-and-docker` และมี [run ที่ผ่านบน PR #26](https://github.com/JeffMerry/reg-me-up/actions/runs/43593623092); ให้ตรวจ run ของ commit ล่าสุดก่อน merge และคง CI/history หลัง Lab 5. PR เข้า `main`, `workflow_call` และการตั้ง required check **ยังต้องตรวจ / TBD ใน Episode ที่เกี่ยวข้อง**
3. เปิด release PR จาก `lab5-staging` เข้า `main` ให้ผู้ที่ไม่ใช่ผู้เขียน review และตรวจ CI ผ่านก่อน merge
4. **แผน [#23](https://github.com/JeffMerry/reg-me-up/issues/23) ยังไม่ทำ:** workflow จาก `main` build/test, สร้าง image, รัน migration, deploy และ smoke test; บันทึก release แรก แล้วทำ visible change อีกครั้งผ่าน reviewed staging PR → release PR → pipeline พร้อมหลักฐาน commit → image → running revision ของทั้งสอง release; trigger, ชื่อ workflow, job, image tag/digest และการอนุมัติภายใน pipeline **TBD** หากมี manual approval ต้องบันทึกชื่อ environment และตำแหน่งปุ่มหลังตั้งค่าจริง
5. ตรวจผลใน GitHub → Actions → workflow/run และ Cloud Run → service → revision/logs รวมทั้ง health/readiness และ domain workflow ที่ public URL; ชื่อ run/URL จริง **TBD**
6. บันทึก SHA ของ merge commit จาก PR และเชื่อม SHA/tag → image digest → Cloud Run revision ที่รับ traffic 100% พร้อมลิงก์หลักฐาน แนวทางใช้ full commit SHA เป็น image tag และ deploy ด้วย digest เป็น **ข้อเสนอ ยังไม่ตั้งค่า** วิธีตรวจว่า public URL เสิร์ฟ commit ใดต้องยืนยัน mapping จาก revision/traffic และหลักฐาน image digest; ยังไม่มี endpoint แสดง commit ที่ตรวจยืนยันแล้ว

## 7. Persistence, verification และข้อจำกัด

ข้อมูล users/events/registrations และ sessions เก็บใน PostgreSQL; local Compose ใช้ named volume ปัจจุบันไม่มีฟีเจอร์อัปโหลดไฟล์ในขอบเขต Sprint 1 การเก็บไฟล์สำหรับฟีเจอร์อนาคต **TBD**. Cloud SQL และการคงข้อมูลหลัง redeploy **ยังไม่ทดสอบ**

ตารางตาม handout §8: ผลตรวจต้องมีชื่อ test/คำสั่ง, ผล, tested commit และหลักฐานจริง; **TBD** ไม่ใช่ PASS

| Check | สิ่งที่ต้องพิสูจน์ / คำสั่งหรือ test | ผล / commit | หลักฐาน |
|---|---|---|---|
| C-01 | PR ปกติรัน build, automated tests และ Docker build บน staging/main | **บางส่วน:** PR เข้า staging ผ่านที่ head `b95a3df`; tested merge `db0bb5e`; PR เข้า main ยังไม่ทดสอบ | [PR #26](https://github.com/JeffMerry/reg-me-up/pull/26), [Actions run](https://github.com/JeffMerry/reg-me-up/actions/runs/43593623092), [รายละเอียด](ci-evidence.md); [#20](https://github.com/JeffMerry/reg-me-up/issues/20) |
| C-02 | temporary PR ที่ test ล้มเหลวถูกบล็อก merge แล้วปิด PR โดย **ไม่ merge** และเก็บประวัติ | **ยังไม่ทดสอบ / commit TBD** | PR, failed check และภาพ blocked merge **TBD**; [#22](https://github.com/JeffMerry/reg-me-up/issues/22) |
| C-03 | clean clone เติม `.env.example` แล้ว build/run กับ DB / คำสั่ง §3 | **ผ่านเฉพาะ local โดย Codex**, tested app commit `a231b89149eefd2a90be86557e0ff9ec6e86e267`; peer review **TBD** | [คำสั่ง, ผลและ image IDs](../../sprints/sprint-1/lab5-docker-evidence.md); [#19](https://github.com/JeffMerry/reg-me-up/issues/19) |
| C-04 | public URL: Organizer เผยแพร่ → Participant ลงทะเบียน → อย่างน้อยหนึ่งกรณีผิดกฎหรือไม่มีสิทธิ์ | **ยังไม่ทดสอบบน Cloud / commit TBD** | URL และ screenshots **TBD**; [#21](https://github.com/JeffMerry/reg-me-up/issues/21) |
| C-05 | record identifiers เดิมอยู่หลัง application restart **และ** แยกตรวจอีกครั้งหลัง redeploy | **บางส่วน:** local Docker restart ผ่าน; cloud restart/redeploy ยังไม่ทดสอบ / release commit **TBD** | [local evidence](../../sprints/sprint-1/lab5-docker-evidence.md); ภาพก่อน/หลังพร้อม URL, run และ revision **TBD**; [#24](https://github.com/JeffMerry/reg-me-up/issues/24) |
| C-06 | release แรกและ visible change รอบถัดไปผ่าน reviewed staging → main → deploy; running revision ตรง commit | **ยังไม่ทดสอบ / commit TBD** | PR, pipeline run, image และ revision **TBD**; [#23](https://github.com/JeffMerry/reg-me-up/issues/23) |

Evidence index สำหรับงานส่ง: ใช้ตาราง C-01–C-06 นี้เป็นจุดเริ่มต้น แล้วจัด index อย่างน้อยหนึ่งแถวต่อ rubric part พร้อม artifact/direct link, IDs/version และผลจริง รวม PDF Answer Part 0–4 ตาม [#25](https://github.com/JeffMerry/reg-me-up/issues/25); ตำแหน่งไฟล์ index/PDF และลิงก์ส่งจริง **TBD** ไม่ถือว่าตารางนี้คือชุดส่งท้ายที่เสร็จแล้ว

## 8. Rollback และ cost control

Rollback: **แผน / ยังไม่ทดสอบ** — บันทึก SHA, image digest และ revision ที่ใช้งานก่อนเปลี่ยน; หากต้องย้อน release ให้ใช้วิธีที่ทีมตั้งค่าและ review แล้วเพื่อกลับไป image ก่อนหน้า จากนั้นตรวจ traffic, public URL, health และข้อมูลเดิม การเปลี่ยน schema อาจทำให้ image เก่าใช้ไม่ได้ จึงต้องทบทวน migration compatibility ก่อน rollback; คำสั่งจริงและผลตรวจ **TBD**

Cost control: ผู้ใช้แจ้งว่าตั้ง Budget แล้ว แต่ยอดและค่า config **TBD**; budget alert ไม่ใช่ hard spending cap ตรวจ Cloud SQL, storage/backup และ Cloud Run ตามค่าใช้จ่ายจริง หยุด resource เมื่อทีมไม่ใช้ตามคู่มือและเริ่มกลับก่อน demo โดย **เปิดระบบไว้ระหว่างช่วงตรวจให้คะแนน** ลบ resource/ฐานข้อมูลเฉพาะหลังทีมยืนยันว่าเก็บหลักฐานและไม่ต้องใช้งานแล้ว
