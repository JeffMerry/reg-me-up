# Episode 5 — first-deploy preparation

สถานะ 14 พฤศจิกายน 2026: เตรียมสคริปต์และ offline tests แล้ว ผู้ใช้สร้าง GCP prerequisites และส่งภาพยืนยันตาม [resource inventory](deployment.md#5-gcp-project-และ-resources) แล้ว: project `cpe334-reg-me-up-513615`, region `asia-southeast1`, registry, Cloud SQL/database/user, runtime service account และ runtime secrets version 1 พร้อม IAM. Codex ไม่ได้เรียก GCP หรืออ่านค่าลับ; **ยังไม่ build/push image, รัน cloud migration หรือ deploy service จริง** ลิงก์หลักฐาน screenshots ถาวรยัง TBD

## ก่อนใช้สคริปต์

ให้ทีมตรวจและเตรียม resources จริงตาม Student Guide Episode 5: APIs ที่จำเป็น, Artifact Registry repository, Cloud SQL PostgreSQL instance/database/user, runtime service account พร้อม Cloud SQL/Secret Manager permissions และ secret versions สำหรับ DATABASE_URL/SESSION_SECRET. ชื่อที่ยืนยันแล้วอยู่ใน `deploy/config.env.example` และ deployment §5; ผู้ดำเนินการคือผู้ใช้ผ่าน Cloud Shell ตามภาพในแชต ส่วนหลักฐานถาวรยัง TBD การสร้าง/เปลี่ยน billing, IAM และ DB ต้องให้สมาชิกตรวจและอนุมัติ; `deploy/deploy.sh` ไม่ทำ provisioning ส่วนเหล่านี้

DATABASE_URL ใน Secret Manager ต้องเชื่อม Cloud SQL ได้จาก Node `pg`/Prisma adapter; เลือก Unix socket ผ่าน query `host=/cloudsql/INSTANCE_CONNECTION_NAME` (URL-encoded) และ encode password; URL มี hostname `localhost` เพื่อผ่าน config validation แต่ query host เป็น socket path ที่ `pg` ใช้เชื่อมต่อ ไม่ใช่ PostgreSQL ในเครื่อง. Cloud Run ต้อง mount connection และใช้ runtime IAM ตาม config. การทดสอบ connection/Prisma migration จริงยัง TBD ไม่คัดลอก connection string หรือรหัสผ่านลง Git/chat. ไม่มีการสร้างบัญชี demo อัตโนมัติ; job provisioning และวิธีส่ง credentials ให้ผู้ทดสอบต้อง review แยก

## Dry run (Bash จาก repository root)

1. รันจาก repository root ใน Git Bash/Cloud Shell; ตรวจ `deploy/config.env.example` แล้วคัดลอกเป็นไฟล์ local ที่ ignore เช่น `deploy/.env` และเติมเฉพาะค่าที่ไม่เป็น secret; secret references ใช้ชื่อและ numeric version ไม่ใช่ค่า secret
2. ตรวจค่าตาม GCP project จริง โดยเฉพาะ REGION, SQL_CONNECTION, runtime account และ numeric secret versions; ตัวอย่างมีค่าที่ผู้ใช้ยืนยันแล้วแต่ต้องตรวจใหม่ก่อนรัน
3. รัน `set -a; source deploy/.env; set +a` แล้ว `DRY_RUN=1 bash deploy/deploy.sh`. Dry run พิมพ์ command plan และไม่เรียก gcloud เลย digest และ URL ที่แสดงในโหมดนี้เป็น placeholder เท่านั้น
4. ให้เพื่อน review script/plan ผ่าน PR เข้า lab5-staging แล้ว release PR เข้า main พร้อม CI ก่อนนำไปใช้จริง

ตัวอย่างคำสั่งจาก root (Bash); ไฟล์ `deploy/.env` มีเฉพาะชื่อ resource/secret references ไม่มีค่าลับ:

```bash
cp deploy/config.env.example deploy/.env
set -a
source deploy/.env
set +a
DRY_RUN=1 bash deploy/deploy.sh
```

Dry run ใช้ได้บน work branch; การ execute ต้องผ่าน peer-reviewed PR เข้า `lab5-staging` แล้ว release PR เข้า `main`. อย่าแก้ guard เพื่อ deploy จาก branch ที่ยังไม่ review

## การรันจริง — ยังไม่ทดสอบ

ต้องมี Bash, Git และ gcloud ใน Cloud Shell หรือเครื่องที่ยืนยันตัวตนไว้แล้ว. ตรวจบัญชี/project และ freshly fetch `origin/main`; checkout `main` ที่สะอาดและผ่าน review/CI. ตรวจ billing, backup, resources และคำสั่งก่อนรัน สคริปต์บังคับ `DRY_RUN=0` และ `CONFIRM_GCP_MUTATION` เท่ากับ Project ID อย่างชัดเจน; ห้ามรันจนกว่าทีมยืนยันการกระทำจริง

ลำดับของสคริปต์: Cloud Build ส่ง image tag full commit SHA → resolve registry digest → migration job ใช้ `npm run db:migrate` → execute job และรอ → deploy service digest เดียวกัน → อ่าน URL และอัปเดต `APP_ORIGIN` ให้ตรงกับ URL. แอปใช้งาน cookie production ผ่าน proxy; ความถูกต้องบน Cloud Run ยังต้องตรวจจริง. การ bootstrap origin อาจทำให้ login ใช้ไม่ได้ชั่วคราวระหว่างขั้นตอน จึงใช้กับ first deploy เท่านั้น ไม่ใช้เป็น routine release pipeline

สคริปต์ตั้ง public access และ scaling min=0/max=3 พร้อม secret references; ทีมต้องอนุมัติก่อนใช้งานจริง เมื่อจบต้องตรวจ health/readiness, image/revision/traffic และ journey C-04 (Organizer เผยแพร่ → Participant ลงทะเบียน → กรณีผิดกฎหรือไม่มีสิทธิ์) ไม่ถือว่า deploy ผ่านเพียงเพราะสคริปต์จบ

## ผลตรวจเฉพาะในเครื่อง

- ตรวจซ้ำ 14 พฤศจิกายน 2026 บน working tree ที่มี base commit `a05833c` ก่อน commit การเปลี่ยนแปลงชุดนี้: Bash syntax ผ่าน, offline tests 4/4 ผ่าน และ dry run ด้วย resource references ใน `deploy/config.env.example` ผ่านโดยไม่เรียก GCP; SHA ที่ dry run แสดงคือ HEAD ขณะตรวจ ไม่ใช่หลักฐานว่า image ของ SHA นั้นถูกสร้างหรือ deploy แล้ว
- Bash syntax ผ่าน; `python -m unittest discover -s deploy/tests -p 'test_*.py'` ผ่าน 4/4 หลังแก้ test stubs ให้รองรับ Git Bash บน Windows
- Tests ใช้ fake git/gcloud เท่านั้น: dry run ไม่เรียก cloud, ปฏิเสธ region TBD, migration failure หยุด service deploy, และใช้ image digest/ปรับ origin ตาม URL
- เริ่ม Git Bash ใน sandbox ครั้งแรกถูกบล็อก จึงรันใหม่โดยได้รับสิทธิ์นอก sandbox; ไม่ใช่ผลทดสอบ GCP
- เพิ่ม offline checks ใน CI workflow แล้ว; ผล run จริงของการเปลี่ยนแปลงชุดนี้ยัง TBD

อ้างอิงคำสั่ง: [gcloud run jobs deploy](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/deploy), [gcloud run deploy](https://docs.cloud.google.com/sdk/gcloud/reference/run/deploy). เอกสารนี้เป็นการเตรียม first deploy; workflow deploy อัตโนมัติยังอยู่ Episode 7
