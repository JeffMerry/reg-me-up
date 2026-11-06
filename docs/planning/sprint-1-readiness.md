# RegMeUp: Repository review และแผนเอกสาร Sprint 1

วันที่ตรวจ: 6 พฤศจิกายน 2026 (Asia/Bangkok)

สถานะ: **Planning draft — pending team review**

ขอบเขตรอบนี้: อ่านเอกสาร ตรวจ repository สรุป requirements และวางแผนเอกสารเท่านั้น

เอกสารนี้ไม่ใช่ SRS/System SDS/feature contracts ฉบับสมบูรณ์ ไม่ใช่การอนุมัติโดยเพื่อนร่วมทีม และไม่ใช่หลักฐานว่าระบบผ่านการทดสอบ รายการทดสอบทั้งหมดด้านล่างเป็น **PLANNED / NOT RUN** ข้อเสนอที่เพิ่มในรอบนี้ยังไม่ใช่ข้อตกลงของทีม

## 1. แหล่งข้อมูลและสถานะที่ตรวจพบ

อ่านแหล่งข้อมูลที่มีในเครื่องครบทั้งสี่ไฟล์:

| รหัสอ้างอิง | ไฟล์ | ใช้อ้างอิง |
|---|---|---|
| G | [group_work_specs_v1.md](../references/group_work_specs_v1.md) | ข้อกำหนดรายวิชา ทีมสองคน Topic 3 workflow และ checkpoints |
| D1 | [project_deliverable_1_v1.md](../references/project_deliverable_1_v1.md) | รายละเอียด Deliverable 1, Parts A–F และหลักฐานที่ต้องส่ง |
| R | [project-cpe334-sprint-1.md](../references/project-cpe334-sprint-1.md) | ร่างบริบท RegMeUp และรหัส FR/BR/NFR/F/DEC/Q/AC/TEST เดิม |
| UI | [ui-spec.md](../ui-spec.md) | baseline หน้าจอและพฤติกรรม UI ตามคำสั่งผู้ใช้ |

บริบทและขอบเขตที่ผู้ใช้ยืนยันในแชตนี้เป็นข้อมูลยืนยันสำหรับงานรอบนี้ ส่วน design choices ที่ต้นฉบับระบุว่า proposed/pending ยังคงสถานะนั้น การให้ใช้ UI เป็น baseline ไม่ได้สร้างหลักฐาน teammate review ย้อนหลัง

ผลตรวจ local repository ก่อนเพิ่มรายงานนี้:

| รายการ | สิ่งที่พบจริง |
|---|---|
| Working branch | `develop` ติดตาม `origin/develop` |
| HEAD | `a8cbbb59021e0039679e0104cdc86fe075798ce8` — `Add README.md` |
| Branch refs | `main`, `develop`, `origin/main`, `origin/develop` ชี้ commit เดียวกัน |
| Remote HEAD ในเครื่อง | `origin/HEAD -> origin/main`; ไม่ได้ query GitHub สดในรอบนี้ |
| Remote URL | `https://github.com/JeffMerry/reg-me-up.git` จากการตรวจในบทสนทนานี้ |
| Tracked files | มีเพียง `README.md` ซึ่งมีชื่อโปรเจกต์และวิชา |
| Existing working-tree files | `docs/references/` สามไฟล์ และ `docs/ui-spec.md`; Git แสดง `?? docs/` |
| Application / tests | ไม่พบ source code, package manifest, schema/migrations, seed, test runner หรือ tests |
| Delivery | ไม่พบ Docker/CI configuration หรือ local setup instructions ที่ใช้รันแอปได้ |
| Repository instructions | ไม่พบ `AGENTS.md` ในเส้นทางแม่ที่ตรวจหรือภายใน repository |
| GitHub workflow evidence | ยังไม่ได้ตรวจ Issues/board/PRs/branch protection ผ่าน GitHub จึงไม่สรุปว่าไม่มี |

วิธีตรวจ: `git status --short --branch`, `git branch -a`, `git ls-files`, `git log`, `git ls-tree ... main`, `git rev-parse HEAD`, file listing และการอ่านไฟล์ ไม่ได้ fetch/switch branch/commit/push หรือรัน application tests ไม่มีแอปให้ build/test ในสถานะที่ตรวจ

**ข้อสรุป:** เป็น repository ระยะตั้งต้นที่มีเอกสารร่างใน working tree ยังไม่มีหลักฐาน implementation หรือ executable verification ใน local checkout นี้ `docs/` ต้องนำเข้า version control ตาม workflow ในงานถัดไป ก่อนใช้เป็นหลักฐานว่า contract/test design มาก่อน implementation

## 2. ข้อขัดแย้ง ความกำกวม และวิธีใช้ข้อมูล

| ประเด็น | ตำแหน่งและคำอธิบาย | ข้อสรุปที่ใช้วางแผน |
|---|---|---|
| รูปแบบ PDF | G §9 บรรทัด 317 ระบุ concise evidence index; D1 §4 บรรทัด 170 และ §4.1–4.3 กำหนด self-contained PDF พร้อมเนื้อหา A–E และ selected evidence F | ใช้รายละเอียดเฉพาะ D1 สำหรับการส่งครั้งนี้: PDF มีเนื้อหา A–F ตามที่กำหนด พร้อม navigation/page references จริง ไม่ส่งเพียงลิงก์ไป repo เหตุผลคือเป็นคำสั่งเฉพาะ assessment ที่ G ระบุว่าจะมี handout แยก |
| CI/CD และ deployment ใน Sprint 1 | G §5.3 บรรทัด 109–117 เป็นข้อกำหนดผลิตภัณฑ์โดยรวม; G §7 Sprint 1 และ §8.3 บรรทัด 307 รวมถึง D1 §2 บรรทัด 39 แยกกำหนดเสร็จใน Lab 5 | ไม่ใช่ข้อขัดแย้งเมื่อแยก checkpoint: D1 ต้อง local release/build/tests/setup และ design รองรับ deployment; Docker/CI/CD/GCP เสร็จ Lab 5 วันที่ 15 พ.ย. ไม่อ้างว่า CI/deployment ทำแล้ว |
| Whole product กับ Sprint 1 | R §1.2–1.3 อธิบายความสามารถทั้งหมด รวม edit/cancel/Instructor; R §1.4 และ UI §1.2 แยก sprint ชัด | ใช้ Sprint allocation ที่ผู้ใช้ยืนยัน: Instructor/cancellation/deadline/edit-capacity อยู่ Sprint 2; check-in/attendance/reports อยู่ Sprint 3 ไม่ดึงทั้งหมดเข้า Sprint 1 |
| UI baseline กับ approval | UI บรรทัด 7, §10 และ revision history ระบุ pending review; routes, timezone และ error mapping หลายส่วนเป็นข้อเสนอ | ใช้ UI เป็น baseline โดยคงสถานะ pending review ของทีมไว้ และปิด API/data decisions ก่อน implementation ไม่มีการอ้างว่าเพื่อนอนุมัติแล้ว |
| Security traceability ไม่ครบ | R §1.6 NFR-01 ครอบคลุมทุก protected operation แต่ §2.2 บรรทัด 223 แสดง F-01 และ F-04–F-08 ขาด F-02/F-03 และ F-09 | เป็นช่องว่าง mapping ไม่ใช่การยกเว้นสิทธิ์ เพิ่ม F-02/F-03 ใน Sprint 1 และ F-09 ใน Sprint 2 พร้อม tests ตาม permission matrix |
| Public discovery verification | R §2.2 บรรทัด 202 ระบุ FR-03 ยังไม่มี AC/TEST เฉพาะ ขณะที่ AC-09 และ UI UIV-01 มี public access บางส่วนแล้ว | คง AC-09 เป็น access matrix และเพิ่ม public list/detail coverage เฉพาะ FR-03 ไม่ถือว่าครอบคลุมทั้งหมดแล้ว |
| Ownership กับข้อมูลสาธารณะ | UI-03 ให้ดู public event detail ได้ทุกคน แต่ UI-07 ต้องตรวจ owner ก่อนแสดง metadata/registrations ของหน้าจัดการ | แยก public response กับ Organizer-private response ผู้จัดอีกคนยังดู public detail ได้ แต่ใช้ private registration-list route ไม่ได้ ห้ามเอา public response มาอ้างว่า private route ผ่าน ownership แล้ว |
| Final video และแหล่งข้อมูลที่ไม่มี | R บรรทัด 451 อ้าง final handout มี 10/4 นาที แต่ไม่มี PDF นั้นใน repo; G final rubric ระบุไม่เกิน 10 นาที | ยังตรวจข้อขัดแย้งใน final handout ไม่ได้ ไม่ยืนยันคำกล่าว 4 นาทีจากเอกสารที่ไม่ได้อ่าน ให้ตรวจต้นฉบับ/ถาม TA ก่อน final ไม่มีผลต่อ D1 ซึ่งไม่ต้องมี video |

ข้อจำกัดต้นฉบับ: R มีอักขระไทยจากการแปลง PDF และตารางขาดช่วง; ข้อความที่ตีความไม่ได้ต้องกลับไปตรวจต้นฉบับ ไม่เติมความหมายเอง R ยังอ้าง Deliverable 2/final PDFs ที่ไม่ได้อยู่ใน `docs/references/` ดังนั้น checkpoints ระยะหลังในรายงานนี้ยึด G ที่อ่านได้ ไม่อ้างว่าอ่าน handouts ที่ขาดแล้ว

## 3. Sprint 1 ที่ยืนยันแล้ว

Product context คือการลงทะเบียนกิจกรรมอบรม/เวิร์กช็อปในมหาวิทยาลัย มี Participant, Organizer และ Instructor ในผลิตภัณฑ์ทั้งหมด แต่ Sprint 1 ทำเฉพาะ Participant/Organizer และผู้เยี่ยมชมที่ไม่ login ซึ่งเป็นสถานะการเข้าถึง ไม่ใช่ role บัญชีใหม่

| Feature | Requirements เดิม | พฤติกรรม Sprint 1 | หน้าจอ baseline |
|---|---|---|---|
| F-01 Identity and access | FR-01; BR-04/05; NFR-01/04 | Login/logout/current identity จริง; server บังคับ role/ownership และ session lifecycle ตาม design ที่ต้องเลือก | UI-01 และ shared navigation/guards |
| F-02 Event publication and discovery | FR-02/03; BR-01/05; NFR-01/06 | Organizer เผยแพร่ในนามตน; public list/detail เฉพาะ published events; My Events เฉพาะของตน | UI-02/03/05/06 |
| F-03 Registration and own retrieval | FR-04; BR-02/03/04; NFR-01/02/03/06 | เฉพาะ Participant ที่ login ลงทะเบียนในนามตน; ดู list/detail ของตนจาก DB; ไม่เกิน capacity/ไม่ซ้ำ แม้ concurrent | UI-03/04/04-D |
| F-04 Organizer registration list | FR-05; BR-05; NFR-01/06 | Organizer อ่าน metadata และรายชื่อผ่าน private operation เฉพาะ event ที่ตนเป็นเจ้าของ | UI-05/07 |
| SYS-01 Local setup and delivery | NFR-05 | เอกสาร setup/configuration, migrations/seed และ build/test ที่ทำซ้ำได้; เตรียม design รองรับ Docker/GCP | ไม่มีหน้าจอ domain ใหม่ |

NFR-01 ที่เพิ่มใน F-02/F-03 เป็นข้อเสนอแก้ traceability ให้ตรงกฎ security เดิม ไม่ใช่การเพิ่ม business scope

Validation ที่ยืนยัน: ชื่อและสถานที่ต้องมีข้อความหลัง trim; start/end ต้องเป็นวันเวลาที่ใช้ได้และ end > start; capacity เป็นจำนวนเต็ม > 0; description เว้นว่างได้ หากข้อมูลผิด backend ต้องปฏิเสธโดยไม่สร้าง event และ UI แจ้งช่องผิด ไม่มีข้อสรุปเรื่องห้ามกิจกรรมในอดีต, minimum duration, maximum capacity หรือ field lengths จึงไม่เติมกฎเหล่านี้เอง

Invariants และ data boundaries:

- จำนวน active registrations ของ event ต้องไม่เกิน capacity; Participant/event เดียวกันมี active ได้ไม่เกินหนึ่งรายการ รวมคำขอพร้อมกันจากคนเดียวกัน
- กรณีเหลือหนึ่งที่นั่งและ Participant ต่างกันสองคนแข่งกัน ต้องสำเร็จเพียงหนึ่งรายการ อีกคำขอถูกปฏิเสธตาม contract ที่จะเลือก และตรวจ final DB state ด้วย
- Identity, role, `participantId`, `organizerId` ที่ใช้กำหนด ownership ต้องมาจาก authenticated identity ฝั่ง server ไม่ใช้ค่าที่ client เลือกเป็นสิทธิ์
- Anonymous ดู published events ได้ แต่ mutation/protected operations ถูกปฏิเสธ Organizer เรียก registration API โดยตรงก็ต้องถูกปฏิเสธ
- Public event response ไม่มี private registrations หรือข้อมูลผู้ลงทะเบียน; Participant ดูทะเบียนส่วนตัวของคนอื่นไม่ได้; Organizer ดูรายชื่อเฉพาะ event ของตน
- การลงทะเบียนสำเร็จต้องเรียกดูได้หลัง reload และ application restart; การทดสอบ redeployment เพิ่มใน Lab 5/final
- Login ไม่สร้าง registration อัตโนมัติ; Participant ต้องยืนยันลงทะเบียนเองหลังกลับจาก login

ไม่รวมใน Sprint 1: Instructor, cancellation, deadline, editing/deleting events, capacity changes, check-in, attendance, reports รวมถึง self-sign-up, password recovery, email verification, Admin/account management, uploads, QR, waitlist, payments, exports, external notifications และ search/filter controls ตาม UI baseline

## 4. จุดที่ต้องตัดสินใจก่อนลงรายละเอียด contract

`P-*` เป็นรายการวางแผนใหม่ ไม่ใช่ `DEC-*` ที่อนุมัติแล้ว ทุกแถวมีสถานะ **OPEN** ผู้รับผิดชอบตัดสินใจคือทีมสองคน โดยยังไม่ได้ระบุเจ้าของงานรายบุคคล

| ID | สิ่งที่ต้องตัดสินใจ | ข้อเสนอ/ทางเลือกที่ยังไม่ยืนยัน | ต้องปิดก่อน |
|---|---|---|---|
| P-01 | Stack, runtime versions, framework/test tools และ DB ที่ทีมถนัด | เลือกจากประสบการณ์ของสมาชิกและรองรับ transaction/durable storage; ไม่อนุมาน stack จาก labs เพราะ repo นี้ไม่มีโค้ด labs | System SDS และ contracts ทุกตัว |
| P-02 | Authentication/session lifecycle | เลือก session หรือ token; ระบุ hash library/config หากจัดการ password เอง, storage, expiry, invalidation/logout, credential transport, cookie/CSRF/CORS ตามวิธีที่เลือก และ response ของ current identity | F-01 และ protected API ทุกตัว |
| P-03 | Atomic registration และ duplicate protection | ข้อเสนอเชิงออกแบบ: transaction ที่ serialize การแย่ง seat ต่อ event และ DB uniqueness ที่ตรง active semantics; ต้องเลือกกลไกจริงตาม DB พร้อม rollback/lock order/retry policy | F-03 รวม TEST-06/07 |
| P-04 | Schema และ active state | User/Event/Registration เป็น conceptual entities; ตัดสินใจชนิด ID, status, nullable description, constraints/indexes, field lengths, required display names และ seed; ไม่สร้าง Attendance/Instructor workflow ใน Sprint 1 | F-02/03/04 และ test fixtures |
| P-05 | API conventions/error policy | methods/paths, request/response fields, validation structure, safe 401/403/404 policy, full/duplicate semantics และ precedence เมื่อทั้ง full+duplicate; UI error categories ยังไม่ใช่ HTTP contract | ทุก feature |
| P-06 | Event timezone/serialization | UI เสนอ Asia/Bangkok; ต้องยืนยันเวลา input/display, API offset/UTC representation และ round trip; ไม่ใช่ข้อสรุป deadline ของ Sprint 2 | F-02 และทุกหน้าที่แสดงเวลา |
| P-07 | Public/own/private read shapes | กำหนด field allowlists, server-issued ID/reference, own-registration lookup สำหรับ UI-03, Organizer totals, ordering/pagination และ detail/deep-link shape | F-02/03/04 |
| P-08 | UI language และ acceptance record | คง UI-01–07, UI-04-D, UI-S01/02 และ visual tokens; English copy เป็นตัวอย่าง ไม่ใช่ข้อยืนยัน localization; จัด teammate review ที่บันทึกได้ | UI-related contracts |
| P-09 | Network outcome unknown / repeated mutation | Registration ต้อง check own state ก่อน retry ตาม UI; ตัดสินใจ publication retry/deduplication policy รวมว่าต้องมี idempotency key หรือไม่ ห้ามอ้างว่าปิดปุ่มแล้วกัน duplicate publish ได้ | F-02/03 |
| P-10 | Local reproduction และ Git workflow | ตกลง seed accounts อย่างน้อย Participant สองราย/Organizer สองราย, setup steps, test DB; ข้อเสนอใช้ develop เป็น sprint staging และ main เป็น accepted release; ตรวจ GitHub board/PR/check settings จริงภายหลัง | SYS-01 และเริ่ม feature work |
| P-11 | Past events / time restrictions | ยังไม่มีข้อกำหนดห้าม publish/register event ที่เริ่มหรือจบแล้ว ต้องระบุให้ชัดว่าจะไม่บังคับใน Sprint 1 หรือขอเปลี่ยน scope โดยไม่แอบเพิ่ม deadline rule | F-02/03 |

Q-01–Q-03 ใน R ปิดแล้วด้วย DEC-05–07 และตรงกับคำสั่งผู้ใช้ ไม่ต้องเปิดถามซ้ำ ส่วน Q-04 deadline, Q-05 cancellation, Q-06 edit/capacity, Q-07 instructor cardinality/history, Q-08 multi-role/time conflict และ Q-09 check-in/report counting ยังเปิดตาม sprint เดิม ไม่ขวางการวางแผน Sprint 1 แต่ต้องรักษาทางเลือก data model โดยไม่ลง implementation ล่วงหน้า

## 5. แผนจัดทำ artifacts

ลำดับด้านล่างเป็นงานที่เสนอให้ทำถัดไป ไฟล์ปลายทางในตาราง **ยังไม่ได้สร้างในรอบนี้** และไม่ถือว่า contract/test design พร้อมใช้แล้ว

| ลำดับ | Artifact ปลายทาง | เนื้อหาที่ต้องจัดทำ | เกณฑ์พร้อมส่งต่อ |
|---|---|---|---|
| 1 | `docs/srs.md` | Context/actors, overall scope + Sprint 1 exclusions, FR-01–11, BR-01–13, NFR-01–07 ตาม allocation เดิม; DEC/Q register และ P decisions ที่ได้รับการยืนยันจริง | Observable requirements พร้อม stable IDs, source และสถานะ; ไม่ถือ draft ว่า approved |
| 2 | `docs/features.md` | F-01–F-09, SYS-01 พร้อม dependencies, sprint, UI IDs และสถานะ | ครบทุก baseline requirement รวม NFR ข้าม feature และงาน local setup |
| 3 | `docs/traceability.md` | Requirement → feature/responsibility → sprint → screen/design → AC → planned TEST → actual test/result/evidence | แสดง gaps ชัด; actual tests/results/commit/review เป็นช่องว่างหรือ NOT RUN จนมีจริง |
| 4 | `docs/system-sds.md` | Stack/reasons, UI→API→DB responsibilities, trust boundaries, data dictionary/relationships/constraints, atomic registration, full permission matrix, auth lifecycle, API/error/date conventions, configuration/migrations/seed และ planned GCP/Docker durable storage | P-01–07 ที่กระทบ design ถูกสรุป; แยก Sprint 1 schema จาก later-sprint concepts และไม่อ้าง deployment จริง |
| 5 | `docs/sprints/plan.md` | Goals/features/dependencies/completion outcome ทั้งสาม sprint, checkpoints, risk และ team review/integration workflow | ครบ product baseline; Sprint 3 มี progress ภายใน 29 พ.ย. ไม่ใช่เริ่มหลัง Sprint 2 deadline |
| 6 | `docs/sprints/sprint-1/f-01.md` ถึง `f-04.md` | Feature SDS + applicable UI/API/data + AC + linked STS + DoD/version/revision history | ไม่มี design decision สำคัญค้างก่อน implementation ของ feature นั้น |
| 7 | `docs/sprints/sprint-1/sts.md` | TEST-01–10 ที่ขยายรายละเอียดและ verification gaps ที่เพิ่ม; fixture/input/action/expected response+DB state, level, automated/manual | ทุก Sprint 1 AC มี verification ที่ทำซ้ำได้; concurrency และ API ownership ใช้ real integration |
| 8 | `docs/sprints/sprint-1/dod.md` | Required behavior, verification execution, review, integration, release/setup/docs และ incomplete-work disclosure | กำหนด completion evidence ล่วงหน้า; ยังไม่ติ๊ก completed |

ทั้ง Parts A–D ต้องครอบคลุมผลิตภัณฑ์ทั้งหมด แต่ contract/API/screen รายละเอียด Sprint 2–3 ยังไม่ต้อง freeze ครบในรอบแรก การจัดทำ final PDF/evidence index เป็นงานภายหลังเมื่อมี artifact และหลักฐานจริง ไม่สร้าง screenshot/results เพื่อเติมช่องว่าง

โครง traceability ที่เสนอ: `Requirement ID | Source/version | Feature | Sprint | UI/SDS | AC | Planned TEST | Actual test file/name | Method | Result | Tested commit | Evidence | Gap/status` รักษารหัสเดิม ไม่ใช้รหัสตัวอย่าง appointment ใน D1 มาทับรหัส RegMeUp

## 6. แผน contracts F-01 ถึง F-04

ทุก contract ต้องมี version/date, author, reviewer/Issue เมื่อมีจริง, linked FR/BR/NFR, scope/dependencies, pre/postconditions, main/negative/boundary flows, server permissions, applicable UI/API/data changes, AC, STS, DoD และ revision reasons ระบุ layer ที่ไม่เปลี่ยนให้ชัด

| Contract | สิ่งที่ต้องเขียนให้ concrete ก่อน implementation | AC/TEST เดิมที่จะใช้ |
|---|---|---|
| F-01 | Login/logout/current identity endpoints; credential validation และ safe errors; identity response; exact session/token lifecycle และ expiry/logout assertions; UI returnTo allowlist/defaults, no automatic registration, private-cache clearing; user/session persistence ตาม design | AC-01/02 และส่วน access ของ AC-09 → TEST-01/02/09 |
| F-02 | Publication + public list/detail + own-event list; request fields/validation ตาม DEC-05; owner จาก server; published-only query/field allowlist; created ID; server seat counts; ordering/pagination; unknown publish outcome; migration/constraints และ UI-02/03/05/06 | AC-03/09 → TEST-03/09; เพิ่ม public-discovery และ own-event verification |
| F-03 | Authenticated Participant registration + own list/detail/status; event existence/publication check; atomic capacity/duplicate rules และ precedence; transaction/rollback behavior; reference จาก server; own detail authorization; timeout reconciliation; UI registered-before-full | AC-04/05/06/07/09/10 → TEST-04/05/06/07/09/10 |
| F-04 | Owner-only event registrations operation; ownership ก่อน private metadata/rows/totals; minimal registrant fields; safe denial/not found; totals/order/pagination; empty/error UI-07; ไม่มี mutation/check-in/export | AC-08/09 → TEST-08/09 |

ข้อเสนอเติม AC/TEST สำหรับ gaps โดยยังไม่ถือเป็น IDs ที่ทีมยอมรับแล้ว:

| Proposed AC / TEST | Requirement/feature | Observable acceptance ที่ต้องลงรายละเอียด |
|---|---|---|
| AC-11 / TEST-11 | FR-03, F-02 | Anonymous และผู้ login อ่านเฉพาะ published list/detail ได้; full events ยังดูได้; unknown/unpublished ปฏิเสธอย่างปลอดภัย; ไม่มี registrant data |
| AC-12 / TEST-12 | NFR-04, F-01 | หากระบบจัดการ password เอง DB ไม่เก็บ plaintext และ credential verification ใช้ hashing design ที่เลือก ไม่มี credentials ใน response/log; lifecycle ยังคงตรวจใน TEST-02 |
| AC-13 / TEST-13 | NFR-05, SYS-01 | Fresh setup ตาม README สร้าง DB/migrations/seed และรัน build/tests ได้โดยไม่ต้องใช้ production secrets |
| AC-14 / TEST-14 | NFR-06, F-01–04 | UI states, login return, logout cache, full/duplicate precedence, safe denial, timeout check-before-retry, mobile/keyboard/modal ตรง UI baseline; แตกเป็น subcases และ map UIV-01–14 |
| AC-15 / TEST-15 | BR-05, F-02 | My Events คืนเฉพาะ Organizer ผู้เรียก; spoof organizerId ไม่ทำให้ event ถูกสร้างในนามคนอื่น; role/owner negatives ของ API ที่มีอยู่ครบ |

ยังไม่กำหนด endpoints, HTTP status, field limits หรือ session TTL เป็นค่าที่ตกลงแล้วในรายงานนี้ ต้องเติมใน contracts หลังปิด P decisions จึงจะใช้เป็น implementation input ได้

## 7. Test design ที่ต้องขยายใน STS

Fixture เชิงแนวคิดที่เสนอ: P1/P2 เป็น Participant, O1/O2 เป็น Organizer; published event ของ O1 ที่ capacity=2 และมี P1 active แล้วหนึ่งรายการ; full event; event ของ O2; unknown ID และ unpublished fixture ถ้า schema ที่เลือกมี publication state ทุกกรณีใช้ synthetic data และแยก/reset fixtures เพื่อไม่ให้ผลขึ้นกับลำดับทดสอบ

| Test เดิม | Level | Preconditions / action ที่ต้องกำหนด | Expected outcome / assertions หลัก |
|---|---|---|---|
| TEST-01 → AC-01 | API integration | Valid seeded credentials; wrong password; unknown account; malformed/missing fields; เรียก current identity | Valid login คืน identity/role ถูกต้องและใช้ protected read ได้; invalid ไม่สร้าง authenticated access และไม่เผย account existence |
| TEST-02 → AC-02 | API integration + selected UI | Login → logout → ใช้ credential/session เดิมซ้ำ; ใช้ session ที่หมดอายุตาม lifecycle; browser Back หลัง logout | ผล logout/expiry และ server rejection ตรง design; private cache ไม่ปรากฏโดยไม่ตรวจสิทธิ์ใหม่ ไม่ใช้เพียงการลบ client token เป็นข้อพิสูจน์ |
| TEST-03 → AC-03 | Unit + API/DB | O1 publish valid event พร้อม empty description; ทีละ missing required field; whitespace name/location; invalid timestamps, equal/reversed range; capacity=0,-1,1.5,nonnumeric | Valid persist/retrieve พร้อม owner=O1; invalid field errors และไม่เพิ่ม event rows ไม่สร้างข้อจำกัดเวลา/ขนาดที่ยังไม่ตัดสินใจ |
| TEST-04 → AC-04 | API/DB + E2E | P1 ลงทะเบียน event ว่าง; reload; own list/detail/status | DB มีหนึ่งรายการ owner/event ถูกต้อง; UI reference/count ตรง server และไม่คืนทะเบียน P2 |
| TEST-05 → AC-05 | API/DB | Participant ที่ยังไม่ลงทะเบียนส่งคำขอใน full event | Full rejection ตาม contract; registration count และ DB state ไม่เปลี่ยน |
| TEST-06 → AC-06 | Concurrent API/DB | P1/event เดียวกัน ส่งซ้ำตามลำดับและส่งพร้อมกันด้วย independent requests; ตรวจทั้ง event ว่างและ full ที่ P1 ลงแล้ว | Final active pair count=1; ที่นั่งเพิ่มเพียงหนึ่งจาก initial state; duplicate outcome ตรง precedence ที่เลือก; ไม่มี unhandled DB error |
| TEST-07 → AC-07 | Concurrent API/DB | ใช้ fixture แยก Event capacity=1 มี active=0; P1/P2 ใช้ independent sessions/connections เริ่มแข่งด้วย barrier ไม่ใช่ await ทีละคำขอ | สำเร็จหนึ่งราย อีกคำขอถูกปฏิเสธตาม contract; final active=1, remaining=0; verify identities/rows และไม่มี partial writes |
| TEST-08 → AC-08 | API/DB | O1 อ่าน event O1 รวม empty case; O2 เรียก private event registrations ของ O1 ด้วย ID โดยตรง | Owner อ่านได้; non-owner ไม่ได้ private metadata, registrants หรือ totals; denied read ไม่เปลี่ยน DB |
| TEST-09 → AC-09 | Parameterized API integration | ทุก operation × anonymous/P1/P2/O1/O2 ตาม matrix; forged IDs/role payload; tampered registration ID/deep link; Organizer เรียก register API โดยตรง | Published public reads อนุญาต; protected anonymous/wrong-role/wrong-owner ปฏิเสธจริงที่ API; ไม่เผย private data; denied mutations ไม่มี DB changes |
| TEST-10 → AC-10 | API/DB + process restart | สร้าง registration ด้วย API; บันทึก ID; restart app โดยคง DB/durable storage; login ใหม่ถ้า session design กำหนด แล้วอ่านรายการเดิม | ID, owner, event, status/reference และจำนวนตรงก่อน restart; ไม่ใช้ reseed ที่สร้างข้อมูลทดแทนรายการที่หาย |

TEST-01–10 ยังต้องเติม exact requests/responses/error status ตาม contracts และแยก automated/manual ชัดเจน TEST-10 เสนอ automated process-restart harness หาก stack รองรับ พร้อม manual demonstration เสริม ยังไม่อ้างว่าเลือก tooling หรือได้ทำแล้ว

รายละเอียดเพิ่มสำหรับ concurrency design:

- TEST-06 ต้องมี capacity เหลือพอแยก duplicate bug ออกจาก full rejection และต้องไม่พึ่ง UI debounce
- TEST-07 ต้องใช้ DB engine/transaction semantics ที่จะใช้จริง ไม่ใช้ mock หรือ in-memory substitute เป็นหลักฐาน correctness
- Retain evidence ว่าเกิด overlapping requests/contended transaction paths จริง; หากต้องใช้ controlled synchronization ให้บันทึก harness และไม่ bypass production business logic การใช้ `Promise.all` อย่างเดียวไม่พิสูจน์ว่าเกิด race แล้ว
- ตรวจผลทั้ง response และ final DB invariant/seat count หลัง commit; ถ้ากลไกมี cached seat counter ต้องตรวจ counter สอดคล้องกับ registrations ด้วย และออกแบบ failure rollback assertion
- ระบุ timeout, deadlock/retry behavior และจำนวนรอบใน STS หลังเลือก DB ห้ามเขียนตัวเลข pass หรือความถี่ที่ไม่ได้รันจริง

Permission matrix ใน System SDS ต้องมีอย่างน้อย: public list/detail; login/current identity/logout ตาม lifecycle; publish; own-event list; register; own-registration list/detail/status; owner-event registrations ครอบคลุมทุก endpoint ที่ออกแบบ ไม่ทดสอบเฉพาะ hidden UI controls

UI verification ต้องรักษา UI-01–07 และ UI-04-D; loading/empty/error แยกกัน; unknown mutation outcome ไม่อ้าง failure/success; already-registered มีลำดับเหนือ full; ป้องกัน private-content flash; reference layouts 1440/390 และรองรับ 320px, keyboard/focus/modal ตาม UI §4.1 ใช้ automated checks ที่เหมาะสมและ manual checklist ที่ระบุผลจริงภายหลัง

## 8. Sprint plan และการทำงานเป็นทีม

| Sprint / checkpoint | Scope | Dependencies และ completion outcome ที่ต้องพิสูจน์ |
|---|---|---|
| Sprint 1 — D1, 8 พ.ย. 2026 23:59 | F-01/02/03/04 + SYS-01 local | Baseline A–D; contracts/STS ก่อน feature implementation; working UI→API→DB registration/retrieval/owner list; capacity/duplicate/concurrency/access/persistence tests; reviewed staging→main release; self-contained PDF A–F |
| Lab 5 — 15 พ.ย. | Delivery บนแอปเดียวกัน | Docker/CI required checks/GCP/repeatable pipeline และ durable storage; failed-check blocking evidence; ไม่ใช่การเลื่อน local working Sprint 1 ไปถึง Lab 5 |
| Sprint 2 — complete ภายใน D2, 29 พ.ย. | F-05 cancellation, F-06 event edits/capacity/deadline, F-09 Instructor assignment/teaching list | Accepted Sprint 1 และ Q-04–08; contracts ก่อน implementation; regression ไม่ทำลาย seat/ownership rules; integrated deployed candidate |
| Sprint 3 — มี tested progress ภายใน 29 พ.ย.; complete 13 ธ.ค. | F-07 check-in/attendance, F-08 summaries; hardening | Q-09 และ registration lifecycle; contracts งานที่เหลือและอย่างน้อยหนึ่ง meaningful tested workflow/rule ภายใน D2 ตามร่าง R; final integration/regression/UAT/re-test/release |
| Lab 6 — 22 พ.ย.; Lab 7 — 29 พ.ย. | Independent UAT/defects; approved maintenance | กันเวลาร่วมกับ sprint; Lab 7 ต้องเป็น instructor/TA-approved change ของพฤติกรรมที่มีแล้ว ไม่ใช้ baseline feature แทน maintenance |

วันที่เหล่านี้มาจากเอกสารที่ให้ ไม่ใช่การตรวจประกาศรายวิชาล่าสุด ณ วันที่ตรวจ 6 พ.ย. ยังไม่พบ implementation และ D1 ครบกำหนด 8 พ.ย. จึงมีความเสี่ยงด้านเวลาสูง ยังยืนยันความเป็นไปได้ของ schedule ไม่ได้จนกว่าทีมประเมินแรงงาน/stack/dependencies หากไม่ทันต้องเปิดเผย incomplete scope และคุย TA ไม่ลดข้อกำหนดหรือสร้าง evidence ย้อนหลัง

ข้อเสนอ sequence ถัดไป:

1. ปิด P-01–11 เท่าที่เกี่ยวกับ Sprint 1 และบันทึก decisions; จัด baseline A–D แล้วให้เพื่อนตรวจ
2. จัด F-01 และ F-02 contracts/STS ก่อน implementation ของแต่ละตัว; ทำ F-03 เมื่อ auth/event/schema/concurrency contract ชัด; F-04 หลัง read models และ ownership policy ตรงกัน
3. บันทึก specification/test-design version ใน Git ก่อน feature implementation; ถ้าแก้ contract ให้มีเหตุผล/impact/revision จริง ไม่เปลี่ยนประวัติให้ดูเหมือนเคยมีมาก่อน
4. งาน implementation ในรอบถัดไปใช้ Issue → feature/fix branch จาก sprint staging → failing meaningful behavior test → implementation → passing checks → teammate PR review → staging integration/system tests → reviewed release PR to main
5. ข้อเสนอใช้ `develop` เป็น staging เพราะมีอยู่แล้ว แต่ยังต้องทีมยืนยันและตรวจ GitHub configuration การตั้ง default เป็น main ไม่ได้แทน integration/review workflow

การแบ่งงานที่เสนอ (ยังไม่ได้ assign): คนหนึ่งนำ F-01/F-03 อีกคนนำ F-02/F-04 และ review ข้ามกัน; ทั้งคู่ร่วม requirements/design/tests/implementation/review/integration ไม่แบ่งถาวรให้คนหนึ่งทำเอกสาร อีกคนเขียนโค้ด ระบุ pair work ตามจริงและไม่ใช้ AI review แทน teammate approval

## 9. หลักฐานและเงื่อนไขก่อนเริ่ม implementation

ต่อ feature ต้องมี contract + test design ที่ concrete, linked requirements/UI/AC/TEST, decisions ที่เกี่ยวข้องถูกบันทึก และ teammate review ตาม UI handoff/รายวิชา ช่อง reviewer, Issue/PR, contract commit และ implementation commit ต้องกรอกเมื่อเกิดจริงเท่านั้น การตรวจในรอบนี้ยังไม่ใช่ teammate review

ภายหลังต้องเก็บ `AC | planned TEST | actual test file/name | automated/manual | command | result/counts | tested commit | evidence` พร้อม red/green versions ของ meaningful rule tests, actual review findings, integration/release tag และ known limitations เปิดเผย failed/skipped tests ไม่ใช้ screenshot หรือ mock-only tests พิสูจน์ backend authorization/concurrency/persistence

สถานะ ณ จบรอบนี้:

- Repository/document inspection: ดำเนินการแล้วตามขอบเขต local ข้างต้น
- SRS/feature inventory/traceability/System SDS/sprint plan/contracts/STS: มีแผนจัดทำในรายงานนี้ ยังไม่ใช่ artifacts ฉบับสมบูรณ์
- Team decisions ใหม่ / teammate review: pending; ไม่ได้สร้าง approval record
- Application implementation/build/tests/release/deployment: ไม่ได้ทำในรอบนี้; planned verification ทั้งหมด NOT RUN
- การแก้ไฟล์รอบนี้: เพิ่มรายงาน planning นี้เท่านั้น ไม่เปลี่ยน reference documents หรือ UI baseline และยังไม่ได้ commit/push

## 10. Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | อ่านเอกสารและตรวจ local repository; บันทึก scope, discrepancies, open decisions และแผน artifacts/contracts/test design | Pending team review |
