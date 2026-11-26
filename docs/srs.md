# RegMeUp — Software Requirements Specification

| Item | Value |
|---|---|
| Version / date | 0.5 / 2026-11-11 (Asia/Bangkok) |
| Product | กิจกรรมอบรมและเวิร์กช็อปภายในมหาวิทยาลัย — CPE334 Topic 3 |
| Baseline authority | บริบทที่ผู้ใช้ยืนยันและคำสั่งให้นำข้อเสนอทางเทคนิคลงเอกสาร |
| Review / implementation | Pending teammate review / not implemented |

## 1. Context and actors

RegMeUp รวมข้อมูลกิจกรรม ที่นั่ง และผลลงทะเบียนที่เดิมติดตามแยกกัน ผู้เข้าร่วมค้นพบกิจกรรมและเรียกดูทะเบียนของตนได้ ผู้จัดทราบจำนวนและรายชื่อผู้ลงทะเบียนในกิจกรรมที่ตนรับผิดชอบ ผลิตภัณฑ์เต็มรองรับ Instructor และ attendance ตามแผนสาม sprint

| Actor | Responsibility / data boundary |
|---|---|
| Anonymous visitor | ดูเฉพาะรายการ/รายละเอียดกิจกรรมที่เผยแพร่แล้ว; เป็น access state ไม่ใช่ role บัญชี |
| Participant | ลงทะเบียนในนามตน เรียกดูทะเบียนตน; cancellation เพิ่ม Sprint 2; ไม่เผยแพร่/จัดการกิจกรรมหรืออ่านทะเบียนส่วนตัวคนอื่น |
| Organizer | เผยแพร่และดูรายชื่อเฉพาะ event ของตน; edit/deadline/Instructor เพิ่ม Sprint 2; check-in/reports เพิ่ม Sprint 3 |
| Instructor | Sprint 2: ดูงานสอนที่ได้รับมอบหมาย; ไม่ได้รับสิทธิ์จัดการกิจกรรมหรืออ่าน private registrations โดยอัตโนมัติ |

ทีมสองคนตาม R: Kittithat Disthanakornkun (67070501004), Thanatip Nitinantakul (67070501023) ข้อมูลนี้มาจากเอกสารร่าง ไม่ใช่หลักฐานการมีส่วนร่วมที่เกิดขึ้นแล้ว

## 2. Scope

Sprint 1 เป็น UI → API → persistent database journey: Organizer login/publish → public discovery → Participant login/register → own persisted retrieval → owner Organizer reads registrations พร้อม login/logout/current identity, server role/ownership enforcement และ concurrent last-seat/duplicate protection

Required publication fields: ชื่อ, start/end date-time, สถานที่, capacity; description optional ชื่อ/สถานที่ต้องมีข้อความ เวลาสิ้นสุดหลังเวลาเริ่ม และ capacity ของ event ที่สร้างและ publish ใหม่ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 60 ทั้ง UI และ backend แสดง/บังคับ validation ตาม contract

Sprint 2: cancellation, event details/capacity changes, registration deadlines, Instructor assignment/teaching list Sprint 3: check-in, attendance, summaries และ hardening

Sprint 1 ไม่รวม editing/deleting/draft controls, Instructor pages, cancellation/deadline, check-in/QR/attendance/reports, image upload, search/filter UI, exports, waitlist, payments และ external notifications ไม่ต้องมี self-sign-up, password recovery, email verification, Admin หรือ advanced account management ใช้ synthetic seeded accounts บทบาทเดียวต่อบัญชีใน Sprint 1

## 3. Functional requirements

รหัสคงจาก R โดยจัดลำดับตาม Sprint จึงอาจไม่เรียงเลข; ไม่มีการเปลี่ยนรหัสหรือความหมาย รายละเอียด implementation อยู่ใน contracts และ [System SDS](system-sds.md)

### Sprint 1

| ID | Observable requirement | Sprint / feature |
|---|---|---|
| FR-01 | Login/logout และ retrieve current-user identity ตาม session lifecycle ที่กำหนด | 1 / F-01 |
| FR-02 | Organizer เผยแพร่ event ของตนเมื่อข้อมูลบังคับครบ/ถูกต้อง; invalid fields แจ้งแก้และไม่สร้าง event; description ว่างได้ | 1 / F-02 |
| FR-03 | Anonymous และผู้ login อ่าน published event list/detail ได้ รวม full events โดยไม่คืน private registration data | 1 / F-02 |
| FR-04 | เฉพาะ authenticated Participant ลงทะเบียนในนามตนและอ่านทะเบียนของตนที่ persist แล้วได้ | 1 / F-03 |
| FR-05 | Organizer อ่านรายชื่อผู้ลงทะเบียนเฉพาะ event ของตนได้ | 1 / F-04 |

### Sprint 2

| ID | Observable requirement | Sprint / feature |
|---|---|---|
| FR-06 | Participant ยกเลิกทะเบียนตนตาม cancellation policy | 2 / F-05 |
| FR-07 | Organizer เปลี่ยนรายละเอียด/capacity และกำหนด deadline ของ event ตนตามกฎ | 2 / F-06 |
| FR-10 | Organizer มอบหมายบัญชี Instructor ที่มีอยู่ให้ event ตนและอ่าน assignment ที่ persist แล้วได้ | 2 / F-09 |
| FR-11 | Instructor อ่านเฉพาะ assigned teaching events พร้อมชื่อ วันเวลา สถานที่ และ teaching details | 2 / F-09 |

### Sprint 3

| ID | Observable requirement | Sprint / feature |
|---|---|---|
| FR-08 | Organizer บันทึก check-in ของ eligible registrations ใน event ตน | 3 / F-07 |
| FR-09 | Organizer อ่าน attendance และจำนวน registered/cancelled/attended ของ event ตนตามนิยามการนับ | 3 / F-08 |

## 4. Business rules

### Sprint 1

| ID | Rule | Sprint |
|---|---|---|
| BR-01 | Capacity ของ event ที่สร้างและ publish ใหม่ต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 60 คน (รวมขอบเขต) | 1 |
| BR-02 | Active registration count ของ event ต้องไม่เกิน capacity รวม competing requests | 1 |
| BR-03 | Participant/event มี active ได้ไม่เกินหนึ่งรายการ รวม concurrent duplicates | 1 |
| BR-04 | Participant อ่านเฉพาะทะเบียนส่วนตัวของตน และไม่มีสิทธิ์ publish/manage events | 1 |
| BR-05 | Organizer จัดการ event/registrations เฉพาะ event ของตน ไม่มี broader ownership permission | 1 |

### Sprint 2

| ID | Rule | Sprint |
|---|---|---|
| BR-06 | Registration หลัง deadline ถูกปฏิเสธ; boundary/timezone policy รอ Q-04 | 2 |
| BR-07 | Cancellation เปลี่ยนสถานะและคืน seat อย่างสอดคล้อง; timing/re-registration/history รอ Q-05 | 2 |
| BR-08 | ลด capacity แล้วต้องไม่ต่ำกว่า active registration count | 2 |
| BR-11 | เฉพาะ owner Organizer มอบหมาย Instructor ให้ event นั้น | 2 |
| BR-12 | Assignee ต้องเป็นบัญชี Instructor ที่มีอยู่จริง; cardinality/change/history รอ Q-07 | 2 |
| BR-13 | Instructor อ่านเฉพาะ assigned work; ไม่แก้ event/capacity/assignment หรืออ่าน private Participant registrations | 2 |

### Sprint 3

| ID | Rule | Sprint |
|---|---|---|
| BR-09 | Check-in ต้องอ้าง eligible registration และไม่สร้าง attendance ซ้ำ | 3 |
| BR-10 | Reports นับจาก persisted registration/attendance ตามนิยามเดียวกัน รวม cancelled treatment | 3 |

## 5. Non-functional requirements

ไม่มี performance SLA ที่ตกลงจาก stakeholder; ไม่สร้าง latency/load figures แล้วอ้างเป็นข้อกำหนดรายวิชา จัดตาม Sprint แรกที่เริ่มใช้ และระบุรอบตรวจซ้ำตาม baseline; Sprint 3 ไม่มี NFR ใหม่ที่เริ่มใน Sprint นั้น แต่มี regression ตามตาราง

### เริ่ม Sprint 1

| ID | Target / verification | เริ่ม / ตรวจซ้ำ |
|---|---|---|
| NFR-01 | ทุก protected API ที่ทดสอบ anonymous/wrong-role/wrong-owner ต้อง deny โดยไม่มี private fields; parameterized API integration ตาม SDS permission matrix | 1 established; regression 2–3 |
| NFR-02 | Registration ที่สร้างสำเร็จเรียกดู ID/owner/event/status เดิมหลัง restart app โดยคง DB ไม่ reseed แทน; TEST-10; redeploy verification ใน Lab 5/final | เริ่ม 1; ตรวจซ้ำ 2–3 และ Lab 5/final |
| NFR-03 | Last-seat race สอง Participant สำเร็จหนึ่งและ final count=capacity; concurrent same-pair final count=1; real PostgreSQL tests TEST-06/07 | 1; capacity-change regression 2 |
| NFR-04 | ไม่มี plaintext password ใน DB/API/log; password hashing, logout replay และ absolute expiry ถูกตรวจด้วย TEST-12/02 | 1 |
| NFR-05 | Fresh local setup/migrations/seed/build/tests ทำตาม README ได้ด้วย synthetic data และไม่มี production secrets; TEST-13; Docker/CI/GCP ต่อ Lab 5 | เริ่ม 1; ตรวจซ้ำ 2–3 + Lab 5 |
| NFR-06 | UI-01–07 รวม UI-04-D มี loading/empty/validation/error ที่เกี่ยวข้อง; keyboard/focus/modal ใช้ได้; layouts 1440/390 รองรับ 320px ไม่มี page-level horizontal overflow; TEST-14 และ UIV-01–14 | 1 then feature regression 2–3 |

### เริ่ม Sprint 2

| ID | Target / verification | เริ่ม / ตรวจซ้ำ |
|---|---|---|
| NFR-07 | Instructor assignment reads persist หลัง restart และ deny anonymous/wrong role/unassigned Instructor โดยไม่คืน private assignment data | 2; regression 3 |

## 6. Decisions and assumptions

DEC-01–07 คงความหมายจาก R และคำยืนยันผู้ใช้; DEC-08–13 บันทึกแนวทางเดิมวันที่ 6 พ.ย. 2026 และ DEC-14 บันทึกการเปลี่ยนแนวทางฐานข้อมูลวันที่ 10 พ.ย. การยืนยันนี้ไม่ใช่ teammate review หรือ test result

| ID | Decision / rationale | Authority / status |
|---|---|---|
| DEC-01 | Sprint 1 ใช้ Participant/Organizer; ไม่เพิ่ม Admin | User context confirmed |
| DEC-02 | Cancellation/deadline ใน Sprint 2; check-in/reports ใน Sprint 3 | User context confirmed |
| DEC-03 | เพิ่ม Instructor สำหรับ university workshops; จำกัด assigned work | User context confirmed; detail Q-07/08 open |
| DEC-04 | F-09 ใน Sprint 2 | User context confirmed |
| DEC-05 | Required event fields/time range; capacity ของ event ที่สร้างและ publish ใหม่เป็นจำนวนเต็ม 1–60; description optional | User context confirmed; Lab 7 contract change |
| DEC-06 | Published list/detail public; registration authenticated | User context confirmed |
| DEC-07 | Participant-only registration; Organizer direct API denied | User context confirmed |
| DEC-08 | เดิมเลือกไม่ใช้ ORM; `pg` + parameterized SQL + versioned SQL migrations | Historical decision, superseded by DEC-14 on 2026-11-10 |
| DEC-09 | React/TypeScript/Vite + Tailwind, Express/TypeScript, PostgreSQL, Vitest/Playwright; backend เดียว | Proposal adopted for documentation; skills of both members not independently verified |
| DEC-10 | PostgreSQL server sessions, Argon2id, absolute 8-hour login, CSRF/cookie protections, server logout invalidation | Proposal adopted; exact lifecycle in SDS/F-01 |
| DEC-11 | READ COMMITTED + event row lock + unique active pair; duplicate before full; remaining derived from rows | Proposal adopted; correctness NOT VERIFIED |
| DEC-12 | REST/JSON, safe error policy, UTC API/DB instants + Asia/Bangkok UI, English UI copy, deterministic paginated lists | Proposal adopted; details in SDS |
| DEC-13 | Bounded text fields, immediate publication, no automatic mutation retry/idempotency store, no start/end cutoff in Sprint 1 | Proposal adopted; cutoff is scope choice, not deadline policy for Sprint 2 |
| DEC-14 | PostgreSQL + Prisma ORM/Prisma Migrate; parameterized SQL เฉพาะจุดที่ต้องใช้ เช่น event row lock; คง DEC-11 และ backend authorization | User selected 2026-11-10; design and Prisma exact versions pending teammate review and installation verification |
| DEC-15 | BR-01 จำกัดเฉพาะ event ที่สร้างและ publish ใหม่; คง event เดิม รวม capacity ที่มากกว่า 60, ID, registrations และ ownership; ไม่เพิ่ม global storage constraint ที่บังคับ event เดิมให้ไม่เกิน 60 | Lab 7 legacy compatibility policy confirmed |

Text limits ใน SDS เป็น technical design limits จาก proposal ไม่ใช่ข้อกำหนดดั้งเดิมของวิชา รายละเอียดเติมเพื่อให้ contract ชัด (Unicode counting/hash/lock timeout) ระบุเป็น design v0.1 และยัง pending teammate review

## 7. Open questions and remaining decisions

| ID | Question | Status / required before |
|---|---|---|
| Q-01 | Required event fields/optional description | CLOSED — DEC-05 |
| Q-02 | Anonymous discovery | CLOSED — DEC-06 |
| Q-03 | Organizer registers as Participant? | CLOSED — DEC-07: ไม่ได้ใน Sprint 1 |
| Q-04 | Deadline timezone และ exactly-at-deadline boundary | OPEN — F-06 contract, Sprint 2 |
| Q-05 | Cancellation window, seat return, re-registration และ history | OPEN — F-05 contract, Sprint 2 |
| Q-06 | Editable fields และ capacity change policy หลังมี registrants | OPEN — F-06 contract, Sprint 2 |
| Q-07 | Instructor count, changes/removal และ assignment history | OPEN — F-09 contract, Sprint 2 |
| Q-08 | Instructor multi-role และ overlapping teaching events | OPEN — F-09 contract, Sprint 2 |
| Q-09 | Check-in window/corrections และ report counting | OPEN — F-07/08 contracts, Sprint 3 |
| ENG-01 | Exact compatible runtime/package versions และ local PostgreSQL provisioning | PARTIAL — existing targets selected, Prisma exact versions/compatibility remain open; see [versions](dependency-versions.md); install/lockfile/provisioning/build validation pending SYS-01 |
| ENG-02 | Feature authors/reviewers, GitHub board/Issues, branch settings และ actual review findings | PARTIAL — Issues #1, #3–#6 assigned per user direction; teammate agreement, actual feature PR review approvals, board and protection remain pending |
| ENG-03 | GCP components/resource access/cost/configuration จาก Lab 5 guidance | OPEN — Lab 5; architecture must support durable DB now |

## 8. Sources and discrepancies

Sources: [G: group specification](references/group_work_specs_v1.md) §§5–8; [D1: assessment handout](references/project_deliverable_1_v1.md) §§2–4; [R: RegMeUp draft](references/project-cpe334-sprint-1.md) Parts A–E; [UI baseline](ui-spec.md)

| Location | Finding / resolution |
|---|---|
| G §9 line 317 vs D1 §4 line 170 and §§4.1–4.3 | G says concise evidence index; specific D1 requires self-contained PDF A–F. Follow D1 for this assessment, keep repository artifacts too |
| G §5.3 vs G §7/§8.3 and D1 §2 | Overall CI/deployment mandatory; completed Docker/CI/GCP due Lab 5, not D1. D1 still requires real local release/build/tests |
| R §2.2 FR-03/NFR-04/NFR-06 | Verification gaps: add AC/TEST-11–15 and UI mapping in traceability; these are designed verification, not executed results |
| R §2.2 NFR-01 | Mapping omitted F-02/F-03/F-09; include them because protected-operation security applies to all affected features |
| UI-03 vs UI-07 | Public metadata can be read by everyone; private owner-management response must deny non-owner before metadata/registrants/totals. Separate response boundaries |
| R references, line 451 | Claimed final-video 10/4 minute conflict cannot be checked: final handout absent. Check original/TA later; D1 requires no video |

No source baseline requirement removed. No implementation/approval/test evidence is inferred from a planning table. Changes preserve IDs and get rationale/version; course-scope changes need instructor/TA agreement where required by G.

## 9. Revision history

| Version | Date | Change | Review |
|---|---|---|---|
| 0.1 | 2026-11-06 | Extracted baseline FR/BR/NFR; recorded user-adopted design direction and remaining questions | Pending teammate review; actual reviewer/Issue/commit not yet recorded |
| 0.2 | 2026-11-06 | Recorded exact version target selection and verified collaborator access for SYS-01 preparation | Pending teammate review; no install/application verification |
| 0.3 | 2026-11-10 | Recorded user-selected Prisma ORM in DEC-14, superseding DEC-08; reopened exact Prisma version selection | Pending teammate review; NOT RUN |
| 0.4 | 2026-11-11 | Grouped FR/BR by Sprint and NFR by first Sprint with regression rounds; retained all requirement IDs | Pending teammate review; NOT RUN |
| 0.5 | 2026-11-11 | Recorded actual GitHub Issue assignees; teammate agreement and feature reviews remain pending | NOT RUN |
