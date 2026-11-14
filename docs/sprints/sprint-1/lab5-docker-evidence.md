# Lab 5 Episode 3 — clean-clone local verification

วันที่ 14 พฤศจิกายน 2026 (Asia/Bangkok), ผู้รัน Codex; peer review **รอดำเนินการ**. ทดสอบ application จาก clean clone ของ PR #16 ที่ commit `a231b89149eefd2a90be86557e0ff9ec6e86e267` โดยเริ่มจาก working tree สะอาด; การทดสอบไม่ใช่ GCP deploy หรือ cloud redeploy. Docker build ใช้ cached layers สำหรับ base/dependencies ตามปกติ ไม่ได้ใช้ `--no-cache`.

หลัง Docker build จาก commit ข้างต้น ได้คัดลอก smoke-test helper เข้า clone แยกเพื่อรัน browser check; helper ถูกเพิ่มใน PR ภายหลังและไม่ใช่ส่วนหนึ่งของ commit/image ที่ทดสอบ. SHA-256 ของ helper ที่ใช้: `da0b762dcefa8a04d44a186e209d00eba7bde07b55d187a3d6d91ca95b59c0a9`. ไฟล์ helper ที่รวมใน PR คือ [`scripts/lab5-docker-smoke.cjs`](../../../scripts/lab5-docker-smoke.cjs). Commit เอกสาร/helper หลังจากนี้ไม่ได้รับการอ้างว่าเป็น tested app commit.

## Target และ setup

- clone จริงจาก GitHub, branch `build/lab5-docker`; `git rev-parse HEAD` แสดง commit ข้างต้น และ initial `git status --short` ว่าง. Node `22.23.4`, npm `10.9.9`.
- ใช้ Compose project **`regmeup-c03-a231-1411`**, named volume ของ project นั้น, PostgreSQL host port `55434`, web port `5176`; ตรวจชื่อ project/volume ว่ายังไม่มีมาก่อนเริ่ม. ไม่ใช้ volume หรือ DB ปกติของผู้ใช้.
- คัดลอก `server/.env.example` เป็น `.env` ภายใน clone แล้วปรับ port ไป `55434` และตั้ง session secret สังเคราะห์ในเครื่อง ไม่บันทึกค่าลับในเอกสาร. ตั้ง `REGMEUP_PG_PORT=55434`, `REGMEUP_WEB_PORT=5176`, `REGMEUP_APP_ORIGIN=http://localhost:5176` และ `SEED_PASSWORD` สังเคราะห์ใน environment.
- จาก root ของ clone รัน `npm ci` (ผ่าน; ติดตั้งจาก lockfile), `docker compose -p regmeup-c03-a231-1411 up -d --wait`, `npm run db:generate`, `npm run db:migrate` และ `npm run db:seed` โดยตั้ง `ALLOW_SYNTHETIC_SEED=1`. Migration `20261111000000_initial` สำเร็จและ seed รายงาน `Synthetic fixtures are present.`
- เตรียม `regmeup_test` ที่แยกจาก app DB: ตั้ง `DATABASE_URL` เป็น `TEST_DATABASE_URL` สำหรับ `npm run db:migrate` และ `npm run db:seed`, จากนั้นติดตั้ง marker ผ่าน `docker/postgres/enable-test-guard.sql` กับ `docker compose -p regmeup-c03-a231-1411 exec -T postgres psql -v ON_ERROR_STOP=1 -U regmeup_app -d regmeup_test`. ตั้ง `DATABASE_URL` กลับเป็น app DB ก่อน integration test ตาม [deployment.md §3](../../labs/lab-05/deployment.md#3-build-test-และ-run-จาก-clean-clone).

## Automated tests และ Docker image

| คำสั่ง / การตรวจ | ผลจริง |
|---|---|
| `npm run test:unit` | 55/55 ผ่าน |
| `npm run test:integration` | 40/40 ผ่าน โดย test guard ตรวจ app/test DB แยก |
| `npm run typecheck` และ `npm run build` | ผ่าน |
| `npx playwright test` | 33/33 ผ่าน โดยใช้ Chromium และ test DB แยก |
| `docker compose -p regmeup-c03-a231-1411 --profile app up --build -d --wait` | build ผ่าน; PostgreSQL/app healthy; migration service exited 0 |
| `docker compose -p regmeup-c03-a231-1411 --profile app run --rm -e NODE_ENV=development -e ALLOW_SYNTHETIC_SEED=1 -e SEED_PASSWORD migrate npm run db:seed` | seed ซ้ำผ่านใน local app DB และคง fixtures เดิม |

ตรวจด้วย `docker image inspect regmeup-c03-a231-1411-app --format '{{.Id}}'` ได้ app image ID `sha256:339b829668fc0cc7c7261244574cb2ba19a8bdbfe991b0f04969df21235fde6b`; migrate image ID จากคำสั่งเดียวกันกับชื่อ `regmeup-c03-a231-1411-migrate` คือ `sha256:8efebdb4db7d157cf8ae117d5f43a8ecb70326d0f92d9a2b6d3a008f84b8b46c`. เหล่านี้เป็น local image IDs ไม่ใช่ Artifact Registry digest หรือหลักฐาน deploy.

ตรวจ `docker run --rm --entrypoint node regmeup-c03-a231-1411-app -e "const fs=require('fs');const p=['/app/server/.env','/app/.git','/app/.toolchain','/app/.aws'];if(p.some(x=>fs.existsSync(x)))process.exit(1);console.log('PASS: inspected paths absent')"` ได้ PASS ทั้งสี่ path; เป็นการตรวจ path ที่ระบุ ไม่ใช่การยืนยันว่า scan secret ทั้ง image แล้ว.

## Browser/API และ restart — วิธีทำซ้ำ

เฉพาะ **ฐานข้อมูล local สังเคราะห์ที่ตั้งใจให้มี event ทดสอบ** เท่านั้น: helper จะสร้างข้อมูลจริงใน DB เป้าหมาย ก่อนเริ่มให้ตรวจ Compose project, origin และฐานข้อมูลด้วยตนเอง `SEED_PASSWORD` ต้องเป็นค่าที่ใช้ seed local DB โดยส่งผ่าน environment อย่างปลอดภัย ไม่ใส่ค่าลง logs/เอกสาร

จาก root ของ checkout ที่มี helper แล้ว ตั้งตัวแปรและรัน:

```powershell
$env:REGMEUP_PG_PORT = '55434'
$env:REGMEUP_WEB_PORT = '5176'
$env:REGMEUP_APP_ORIGIN = 'http://localhost:5176'
$env:LAB5_SMOKE_BASE_URL = 'http://localhost:5176'
$env:LAB5_SMOKE_CONFIRM = 'isolated-local-only'
New-Item -ItemType Directory -Force .toolchain | Out-Null
$env:LAB5_SMOKE_RECORD_PATH = Join-Path (Get-Location) '.toolchain/lab5-smoke-record.json'
# ตั้ง SEED_PASSWORD สังเคราะห์อย่างปลอดภัยก่อนรัน; ติดตั้ง Chromium ด้วย npx playwright install chromium หากยังไม่มี
node scripts/lab5-docker-smoke.cjs create
docker compose -p regmeup-c03-a231-1411 --profile app stop app postgres
docker compose -p regmeup-c03-a231-1411 --profile app up -d --wait
node scripts/lab5-docker-smoke.cjs verify
```

`create` ตรวจ `/api/health` และ `/api/ready` ได้ 200, unknown `/api` ได้ 404, browser login Organizer, เผยแพร่ event, public API lookup, login Participant และลงทะเบียนผ่าน UI ได้สำเร็จ. `verify` ตรวจ event และ registration ID เดิมหลัง restart ได้สำเร็จ. Test fixture ที่สร้าง: event ID `e2f06677-5be9-4b7e-9cef-0ddb744ee278`, registration ID `4d8726f3-bd36-45b0-9881-4f385d823911` (ข้อมูลสังเคราะห์ใน local test volume เท่านั้น). Browser ที่ใช้คือ Playwright Chromium headless shell รุ่น 1234 ซึ่งกำหนดผ่าน `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`.

Test app/DB สามารถหยุดด้วย `docker compose -p regmeup-c03-a231-1411 --profile app stop app postgres` โดยเก็บ volume ไว้; อย่าใช้ `down -v` กับ volume ที่ต้องเก็บข้อมูล. การตรวจนี้ยังไม่พิสูจน์ persistence หลัง **cloud redeploy**, C-04 บน public URL, CI gate หรือการทดสอบซ้ำโดย teammate.
