# RegMeUp — ข้อเสนอเพื่อเริ่ม Sprint 1

สถานะปัจจุบัน: เอกสารนี้เป็น snapshot วันที่ 6 พฤศจิกายน 2026; การตัดสินใจไม่ใช้ ORM ด้านล่างถูกแทนที่ด้วย Prisma ORM ตาม DEC-14 วันที่ 10 พฤศจิกายน 2026 ผู้ใช้สั่งให้นำข้อเสนอไปสรุปเป็น baseline แล้วในบทสนทนาวันที่ 6 พฤศจิกายน 2026 อ่าน [เอกสารหลัก](../README.md), [SRS decisions](../srs.md) และ [System SDS](../system-sds.md) สำหรับข้อสรุปปัจจุบัน เนื้อหาด้านล่างคงเป็นประวัติข้อเสนอก่อนรับแนวทาง ไม่ใช่สถานะ pending ของทุกทางเลือกในปัจจุบัน และไม่ใช่หลักฐาน teammate approval

วันที่: 6 พฤศจิกายน 2026 (Asia/Bangkok)

สถานะ ณ วันที่ 6 พฤศจิกายน 2026: **PROPOSED / PENDING TEAM DECISION**; ขณะนั้นผู้ใช้ยืนยันไม่ใช้ ORM (ภายหลังเปลี่ยนเป็น Prisma ตาม DEC-14)

เอกสารนี้ตอบแนวทางเตรียมงานทั้ง 6 เรื่องต่อจาก [readiness review](sprint-1-readiness.md) และใช้ [UI baseline](../ui-spec.md) เดิม ยกเว้นการไม่ใช้ ORM ที่ผู้ใช้ยืนยันในบทสนทนาแล้ว ตัวเลือกเทคโนโลยี ค่าเวลา ขนาดข้อมูล endpoint และรหัสใหม่ในเอกสารนี้ยังเป็นข้อเสนอ ไม่มี application implementation, executable tests หรือผลการทดสอบเกิดขึ้นจากเอกสารนี้

## 1. เทคโนโลยีและวิธีรัน

การตัดสินใจจากผู้ใช้: **ไม่ใช้ ORM** (6 พฤศจิกายน 2026) ข้อเสนอจึงคงการเขียน parameterized SQL ผ่าน `pg` และ versioned SQL migrations โดยตรง ไม่เพิ่ม Drizzle/Prisma หรือ ORM อื่น ส่วน Tailwind CSS เป็นข้อเสนอสำหรับ UI ที่ยังรอยืนยัน การบันทึกคำสั่งผู้ใช้นี้ไม่ใช่หลักฐาน teammate review

ข้อเสนอหลักมีเงื่อนไขว่า **สมาชิกทั้งสองคนพอใช้ JavaScript/TypeScript ได้** ไม่ได้อนุมานว่าทีมใช้ stack นี้ใน labs หากทีมมี stack เดิมที่ทั้งคู่ถนัดกว่า ให้ใช้ stack เดิมและคง design/acceptance rules ด้านล่าง โดยเฉพาะ transaction, authorization และ persistence

| ส่วน | ข้อเสนอ | เหตุผลเชิงออกแบบ |
|---|---|---|
| Frontend | React + TypeScript + Vite; เสนอ Tailwind CSS ตาม tokens ใน ui-spec (รอยืนยัน) | มีหน้าจอชัดเจนอยู่แล้วและใช้ TypeScript ร่วมกับ backend ได้ |
| Backend | Node.js + Express + TypeScript; backend เดียว แบ่ง modules auth/events/registrations | เหมาะกับขนาดทีมและทำ UI→API→DB ให้ตรวจสอบได้ โดยไม่เพิ่มหลาย services |
| Database | PostgreSQL; ใช้ `pg` พร้อม parameterized SQL | แสดง transaction/locking/constraints ได้ตรงกับ domain rules |
| Schema changes | SQL migrations ที่มีหมายเลขและ migration runner บันทึก applied versions | เปลี่ยน schema และทำ fresh setup ซ้ำได้ ไม่แก้ DB แต่ละเครื่องด้วยมือ |
| Tests | Vitest สำหรับ logic/API integration ผ่าน HTTP กับ test DB จริง; Playwright สำหรับ selected E2E | แยกระดับการพิสูจน์ business rules, server permissions และ UI journeys |

ข้อเสนอการจัดโครงสร้าง: `client/`, `server/`, `server/db/migrations/`, `server/tests/`, `e2e/`, `docs/` ภายใน backend ใช้ route/controller → service → repository โดย transaction และ domain authorization อยู่ใน service ส่วน database constraints เป็นการป้องกันอีกชั้น

Local dev: frontend proxy `/api` ไป backend; ใช้ PostgreSQL local หรือ container ตามเครื่องทีม แต่ integration tests ใช้ PostgreSQL เช่นเดียวกัน Production design: browser เข้าผ่าน origin เดียว ให้ backend เสิร์ฟ frontend build และ API ได้; storage ของ DB แยกจาก filesystem ชั่วคราวของ app เตรียม container packaging และ persistent DB สำหรับ GCP ใน Lab 5

ก่อน implementation ต้องระบุ exact runtime/package versions ที่รองรับกันใน System SDS, commit lockfile และ README โดยยังไม่มีการติดตั้ง dependencies ในรอบนี้ ชื่อ commands ที่เสนอให้สร้างภายหลัง: `dev`, `db:migrate`, `db:seed`, `build`, `test:unit`, `test:integration`, `test:e2e` ชื่อเหล่านี้ยังรันไม่ได้ใน repo ปัจจุบัน

อ้างอิงความสามารถของเครื่องมือ: [React/Vite setup](https://react.dev/learn/build-a-react-app-from-scratch), [Vitest](https://vitest.dev/guide/), [Playwright](https://playwright.dev/docs/intro) การเลือกชุดนี้เป็นความเห็นเชิงออกแบบสำหรับ RegMeUp ไม่ใช่ข้อกำหนดของรายวิชาหรือการรับรองว่าเหมาะกับทักษะทีมแล้ว

## 2. Authentication และสิทธิ์

ข้อเสนอใช้ **server-side session เก็บใน PostgreSQL** ผ่าน `express-session` และ PostgreSQL store เช่น `connect-pg-simple` เพื่อให้ logout invalidation และการทดสอบ session เดิมชัดเจน มี role เดียวต่อบัญชีใน Sprint 1: Participant หรือ Organizer

| เรื่อง | พฤติกรรมที่เสนอ |
|---|---|
| Credentials | Seed accounts; normalize email แบบเดียวกันตอน seed/login; password ไม่ trim; ใช้ Argon2id hash ผ่าน library และระบุ hash parameters ใน F-01 ก่อนลงมือ |
| Login | ตรวจ credentials; ข้อความผิดเหมือนกันทั้ง wrong password/unknown account; regenerate session ID หลัง login; เก็บ user ID และเวลาเริ่ม session; อ่าน role จากข้อมูล server |
| Lifetime | Absolute expiry 8 ชั่วโมงนับจาก login; ไม่ต่ออายุอัตโนมัติ ต้องตรวจเวลาฝั่ง server ไม่พึ่ง cookie expiry อย่างเดียว |
| Cookie | `HttpOnly`, `SameSite=Lax`, `Path=/`; `Secure` ใน HTTPS production; local HTTP มี config แยกที่บันทึกชัด |
| CSRF | Session-bound CSRF token ส่งผ่าน header สำหรับ POST รวม login/logout; ตรวจ Origin ตาม allowlist; ออก token ใหม่หลัง regenerate session และให้ UI รับ token ใหม่ก่อน mutation ถัดไป |
| Current identity | GET `/api/auth/me`; authenticated คืน `id`, `displayName`, `role`; anonymous/expired คืน 401 ให้ UI ใช้ anonymous state |
| Logout | Destroy session ใน store และ clear cookie; คืน success หลังทำสำเร็จเท่านั้น; credential/session เก่าใช้ protected API ไม่ได้ |
| UI behavior | Logout/expiry เคลียร์ private caches; login ใช้ allowlisted internal returnTo; ไม่ลงทะเบียนอัตโนมัติหลัง login |

Backend middleware ตรวจ session/role ส่วน service/query ตรวจ ownership ของ resource ทุกครั้ง ไม่รับ role/owner จาก client เป็นสิทธิ์ ปิดการเข้าถึง private list/detail ด้วย policy เดียวกัน และไม่คืน password hash/session secrets ใน response/log; private/auth responses ใช้ Cache-Control: no-store ร่วมกับการตรวจ identity และเคลียร์ private client state ตาม UI baseline

Permission matrix ที่เสนอ:

| Operation | Anonymous | Participant | Organizer |
|---|---|---|---|
| Published event list/detail | อนุญาต | อนุญาต | อนุญาต |
| Publish / My Events | ปฏิเสธ | ปฏิเสธ | เฉพาะบัญชีตน |
| Register / own-registration reads | ปฏิเสธ | เฉพาะตน | ปฏิเสธ |
| Event registration list | ปฏิเสธ | ปฏิเสธ | เฉพาะ owner ของ event |

อ้างอิง library: [express-session](https://expressjs.com/en/resources/middleware/session/), [PostgreSQL session store](https://github.com/voxpelli/node-connect-pg-simple), [Argon2 library](https://github.com/ranisalt/node-argon2) Express ระบุว่า default MemoryStore ไม่ได้ออกแบบสำหรับ production; proposal นี้จึงใช้ persistent store ตั้งแต่ Sprint 1

## 3. Data model และ concurrency

ข้อมูล domain เริ่มที่สามตาราง และมี session store เพิ่มสำหรับ authentication:

| Entity | Fields ที่เสนอ |
|---|---|
| User | UUID `id`, unique normalized `email`, `password_hash`, `display_name`, `role`, `created_at` |
| Event | UUID `id`, FK `organizer_id`, `title`, `starts_at`, `ends_at`, `location`, integer `capacity`, nullable `description`, `publication_status`, `created_at` |
| Registration | UUID `id`, FK `event_id`, FK `participant_id`, `status`, `registered_at`; ใช้ ID เป็น reference ไม่ต้องสร้าง ticket/QR เพิ่ม |

ข้อเสนอค่าข้อมูล: title 1–200 ตัวอักษรหลัง trim; location 1–300; display name 1–100; description ไม่เกิน 10,000 และ normalize empty/whitespace-only เป็น null โดยนิยามการนับ Unicode ให้ตรงทั้ง frontend/backend ข้อจำกัดเหล่านี้เป็น **ข้อเสนอใหม่** ต้องทีมยืนยันก่อนใช้ validation/schema/tests ไม่ใช่ข้อกำหนดจาก reference

DB constraints: foreign keys, capacity > 0, ends_at > starts_at, required/nonblank fields และ unique active registration ต่อ `(event_id, participant_id)` ใช้ partial unique index เฉพาะ `status='ACTIVE'`; Sprint 1 ทุก registration ใหม่เป็น ACTIVE และยังไม่มี cancellation transition ข้อเสนอนี้ไม่ตัดสินสิทธิ์ลงทะเบียนใหม่หรือประวัติการยกเลิกของ Sprint 2

Event สร้างและเผยแพร่ในคำขอเดียว; public queries คืนเฉพาะ `PUBLISHED` การมี publication status ไม่เพิ่ม draft/unpublish/edit endpoints ใน Sprint 1 เริ่ม registration status เฉพาะ ACTIVE; ออก migration สำหรับสถานะอนาคตเมื่อ contract Sprint 2 ยืนยันแล้ว

Transaction สำหรับ registration ที่เสนอ ใช้ PostgreSQL READ COMMITTED และ **ทุก statement ใช้ DB client/connection เดียวกัน**:

1. ตรวจ authenticated Participant ก่อนเข้าธุรกรรม
2. BEGIN แล้ว lock Event row ด้วย `SELECT ... FOR UPDATE`; event ต้องมีอยู่และเผยแพร่แล้ว
3. ตรวจ active registration ของ Participant/event นี้ก่อน ถ้ามี คืน duplicate conflict โดยไม่ insert แม้ event จะเต็มแล้ว
4. นับ active registrations ภายใต้ event lock; ถ้า count >= capacity คืน full conflict
5. INSERT active registration, COMMIT แล้วจึงคืน success พร้อม server ID; ทุก failure rollback ก่อนจบคำขอ

คำขอที่แย่ง event เดียวกันต้องได้ lock ตามลำดับ คนหลังอ่าน count ใหม่หลังคนแรก commit สำหรับ Sprint 1 ข้อเสนอนี้คำนวณ remaining จาก active rows และ capacity โดยไม่เก็บ seat counter ซ้ำที่ต้อง sync อีกค่า

**เงื่อนไข correctness:** writer ทุกตัวที่เปลี่ยนจำนวน active/capacity ต้องใช้ protocol ที่เข้ากันและ lock Event ก่อนเสมอ เมื่อเพิ่ม cancellation/capacity change ใน Sprint 2 ต้องขยาย protocol และ regression tests; partial unique index ป้องกัน duplicate แต่ไม่ได้ป้องกัน capacity เกินด้วยตัวเอง ต้องกำหนด lock timeout/failure mapping ก่อนลงรายละเอียด F-03 และห้ามแสดง success ก่อน commit

แนวทางนี้เป็น design ที่ต้องพิสูจน์ ไม่ใช่ผลการทดสอบ อ้างอิงกลไกจาก [PostgreSQL row locking](https://www.postgresql.org/docs/current/explicit-locking.html), [partial unique indexes](https://www.postgresql.org/docs/current/indexes-partial.html) และ [pg transactions ที่ต้องใช้ client เดียวกัน](https://node-postgres.com/features/transactions)

## 4. API และความสอดคล้องกับ UI

ข้อเสนอ REST/JSON ใต้ `/api`; request ที่เป็น mutation ไม่รับ `organizerId`, `participantId` หรือ role เป็นตัวกำหนดสิทธิ์ unknown fields ให้ validation error ไม่ silently ใช้ค่าเหล่านั้น

| Endpoint ที่เสนอ | Access / behavior |
|---|---|
| GET `/api/auth/csrf` | Bootstrap CSRF token; ไม่มี authenticated/private user data |
| POST `/api/auth/login` | Public + CSRF; email/password → identity และ session cookie |
| POST `/api/auth/logout` | Session + CSRF; invalidate session |
| GET `/api/auth/me` | Session → current identity; ไม่มี session คืน 401 |
| GET `/api/events` | Public published list; pagination |
| GET `/api/events/:eventId` | Public published detail; ไม่มี private registrations |
| POST `/api/events` | Organizer + CSRF; publish event ของตน; 201 |
| GET `/api/me/events` | Organizer own-event list พร้อม active count/remaining |
| POST `/api/events/:eventId/registrations` | Participant + CSRF; empty body; server กำหนด owner; 201 เมื่อ commit แล้ว |
| GET `/api/me/registrations` | Participant own list; optional `eventId` filter รองรับ own status ของ UI-03 |
| GET `/api/me/registrations/:registrationId` | Participant own detail รองรับ UI-04-D/deep link |
| GET `/api/organizer/events/:eventId/registrations` | Owner Organizer; authorized metadata + registrants + totals ใน response เดียว |

ข้อเสนอ status/error policy: validation=422 `VALIDATION_ERROR`; missing/expired session=401 `UNAUTHENTICATED`; wrong role=403 `FORBIDDEN`; unknown/unpublished/non-owned private resource=404 `NOT_FOUND`; full=409 `EVENT_FULL`; duplicate=409 `ALREADY_REGISTERED` พร้อม own registration ID ที่ปลอดภัย ไม่ส่ง SQL/stack traces

Error shape ที่เสนอ: `{error: {code, message, fieldErrors?}}` โดย `fieldErrors` map ชื่อ field → ข้อความ Success detail ใช้ `{data: ...}`; lists ใช้ `{data: [...], meta: {page, pageSize, total}}` และ Organizer registration response มี `event` กับ `summary` ที่ server คำนวณจาก rows ที่อนุญาต

Public fields: ID, title, times, location, capacity, remaining, description และ organizer display name เท่านั้น; owner list/private registration responses เพิ่มเฉพาะ fields ที่ UI ต้องใช้ ไม่เพิ่ม email/phone ลง registrant list

ข้อเสนอ pagination page size 20, maximum 100; public events เรียง `starts_at ASC, id ASC`; My Events เรียง `created_at DESC, id DESC`; My Registrations เรียง `registered_at DESC, id DESC`; Organizer registrants เรียง `registered_at ASC, id ASC` ใช้ totals จาก server ไม่ใช้จำนวน rows ในหน้าปัจจุบัน

เวลา: เสนอ input/display เป็น Asia/Bangkok พร้อม label UTC+7; API รับ ISO 8601 ที่มี offset เท่านั้น และคืน UTC; DB ใช้ timestamptz ทดสอบ round trip ข้ามวันด้วย Sprint 1 ยังไม่เพิ่ม cutoff ตาม start/end หรือ deadline; การรับกิจกรรมอดีตเป็น policy ที่ต้องทีมยืนยันก่อน F-02/F-03

UI: รักษา screens/routes/tokens ตาม ui-spec; เสนอใช้ข้อความ English ตาม baseline ใน Sprint 1 แต่ยังต้องทีมตกลงภาษา โดยไม่มี requirement ทำระบบหลายภาษาเพิ่ม Full event ยังอ่านได้; already registered มาก่อน Full; login return ไม่ submit registration; timeout หลัง mutation ต้อง check My Registrations/My Events ก่อนเสนอส่งซ้ำ

Publication retry policy ที่เสนอสำหรับ Sprint 1: ไม่ automatic retry POST; เก็บ form และให้ตรวจ My Events ก่อนส่งใหม่ ยังไม่รับประกัน exactly-once publication หรือเพิ่ม idempotency-key storage ส่วน registration ใช้ transaction+unique active pair และ own-state lookup แก้ unknown outcome ตาม baseline

## 5. จัดทำเอกสารให้ตรวจและทำงานต่อได้

| Artifact | วิธีจัดทำที่เสนอ |
|---|---|
| `docs/srs.md` | ย้ายสาระจาก R ที่ยืนยันได้เป็น requirements อ่านง่าย คง FR/BR/NFR/DEC/Q IDs; ระบุ sprint/exclusions และ status/source; ไม่ให้ technical proposals กลายเป็น approved business decisions |
| `docs/features.md` | F-01–09 และ SYS-01; dependencies, requirements, sprint และ UI IDs; ขยาย NFR-01 mapping ไป F-02/F-03/F-09 ให้ครบ |
| `docs/traceability.md` | Requirement → feature → sprint → UI/SDS → AC → planned test → actual result/version/evidence; ข้อมูล actual ยัง NOT RUN/ไม่มีหลักฐาน |
| `docs/system-sds.md` | บันทึก choices ที่ทีมตกลงจริง, architecture/data diagrams, dictionary/constraints, transaction sequence, permission matrix, API/date/error conventions, auth/config/setup และ planned durable deployment |
| `docs/sprints/plan.md` | Sprint 1 F-01–04; Sprint 2 F-05/06/09; Sprint 3 F-07/08; checkpoints และการทำงานกับ Labs 5–7 ตาม readiness report |

ทำเอกสารให้กระชับและเชื่อมกัน: SRS ระบุว่าอะไรต้องเกิด; System SDS ระบุระบบจะรองรับอย่างไร; contract ลงรายละเอียดเฉพาะ feature; traceability เชื่อมไปที่นิยามหลัก ไม่คัดเนื้อหาซ้ำจนเกิดหลาย version ที่ขัดกัน

การนำข้อเสนอนี้ไปตัดสินใจ: เพิ่ม decision records โดยระบุหัวข้อ ตัวเลือก เหตุผล ผู้ตัดสิน วันที่ และ artifact ที่กระทบหลังทีมตัดสินจริง ห้ามกำหนดให้เอกสารนี้เป็น approved อัตโนมัติ ไม่เขียนทับ DEC-01–07 เดิม และไม่อ้างว่าได้รับ teammate review แล้ว

## 6. Contracts, test design และ workflow

ข้อเสนอเขียน contract แยก F-01/F-02/F-03/F-04 และ shared `sts.md`/`dod.md` ใน `docs/sprints/sprint-1/` โดย contract ทุกตัวมี version, links, main/negative/boundary flows, UI/API/data details, AC, planned tests, DoD และ revision history

| Feature | Contract ก่อน implementation | Planned verification ที่ต้องลง input/action/expected result |
|---|---|---|
| F-01 | Session/CSRF endpoints + lifecycle + hash configuration + identity/role + UI login/logout/returnTo | TEST-01/02/09; เพิ่ม hashing verification: valid/invalid login, regenerated SID, logout replay, expiry, missing CSRF, wrong role, private-cache behavior |
| F-02 | Field validation/limits + publish/public/own list response + date semantics + safe errors | TEST-03/09 และ proposed TEST-11/15: empty description, missing/invalid required fields, time range/capacity, public published-only/no private data, own events และ spoof owner |
| F-03 | Atomic transaction + constraints + own reads/status + full/duplicate precedence + unknown outcome | TEST-04/05/06/07/09/10: success/retrieval, full, sequential/concurrent duplicate, last-seat race, other participant's detail, restart persistence |
| F-04 | Owner-authorized metadata/registrants/totals + pagination/privacy + empty/error states | TEST-08/09: owner success, empty list, other owner rejection, role/anonymous denial, no private metadata leak |

TEST-11–15 และ AC-11–15 ที่ readiness report เสนอ ยังเป็น **PROPOSED** ต้องยืนยันและนิยาม subcases ใน STS ก่อนใช้อ้างว่า coverage ครบ UI UIV-01–14 ต้อง map เข้าชุด verification จริง ไม่แทน API/DB tests ด้วย screenshots

Concurrent test ที่เสนอ: capacity=1, active=0, Participant สองคนใช้คนละ session/DB connection เริ่มแข่งด้วย barrier และเก็บหลักฐานการ overlap/lock contention; assert สำเร็จหนึ่งคน อีกคน full conflict และ DB active=1 เพิ่มกรณี Participant เดียวส่งพร้อมกันขณะยังมีหลาย seat เพื่อพิสูจน์ duplicate rule แยกจาก full rule ไม่ใช้ mock DB

Persistence test: สร้างรายการผ่าน API → จำ registration ID → restart app โดยไม่ reset/reseed DB → login ใหม่เมื่อจำเป็น → อ่าน ID เดิมและตรวจ owner/event/status; session persistence กับ registration persistence เป็นคนละข้อพิสูจน์

Selected E2E: (1) anonymous discovery → login return → explicit register → own detail, (2) Organizer login → publish → owner registrants และ negative access; supplement manual mobile/keyboard/modal/unknown-network-outcome cases โดยบันทึก expected/actual/version เมื่อรันจริง

Workflow ที่เสนอ: Issue linked contract → feature branch จาก `develop` → บันทึก contract/test design ใน commit ก่อน implementation → intended behavior test fails → implement → tests pass → teammate review PR เข้า `develop` → integration checks → reviewed release PR เข้า `main` พร้อม tag/commit ใช้ meaningful red/green evidence จริง ไม่ถือ compiler/module-not-found error เป็นหลักฐานว่ากฎ domain ทดสอบแล้ว

ทั้งสองคนร่วม baseline/design และสลับ author/reviewer ตาม feature ไม่แบ่งถาวรตาม frontend/backend หรือ docs/code ทุก feature owner รับผิดชอบทั้ง UI/API/DB ที่เปลี่ยนและ tests พร้อมให้เพื่อนตรวจ โดยยังไม่ได้ assign บุคคลหรือสร้าง Issue/PR ในรอบนี้

เริ่มทำได้ทีละ feature หลัง design decisions ที่เกี่ยวข้องถูกสรุปและ contract/STS พร้อม ไม่ต้องรอรายละเอียด Sprint 2–3 ครบทั้งหมด สำหรับ F-03 ต้องปิด concurrency protocol และ data constraints ก่อนเริ่ม ส่วนหลักฐาน completion ต้องมี implementation, executed tests, teammate review และ integration จริงครบตาม DoD

## สถานะและการส่งต่อ

สิ่งที่ต้องให้ทีมเลือกจากข้อเสนอนี้ก่อน: stack ที่ทั้งคู่ทำได้, session 8 ชั่วโมง/CSRF design, schema/limits, transaction+partial uniqueness, API/error/date/list policy และ UI language ถ้าเปลี่ยนข้อเสนอ ให้แก้ design/AC/STS ที่เกี่ยวข้องให้ตรงกันก่อนเริ่ม feature นั้น

บันทึกการเปลี่ยนแปลง 6 พฤศจิกายน 2026: ผู้ใช้ยืนยันไม่ใช้ ORM; คงข้อเสนอ `pg` + SQL migrations และบันทึก Tailwind เป็นข้อเสนอที่ยังไม่ยืนยัน ไม่มีการเปลี่ยน business requirements หรือเริ่ม implementation

รอบนี้เพิ่มเอกสารข้อเสนอเท่านั้น ไม่ติดตั้ง dependencies ไม่สร้าง application/schema/migrations/tests ไม่ commit/push และไม่เปลี่ยน UI/reference baseline Verification ทั้งหมด **PLANNED / NOT RUN**; review/approval **PENDING**
