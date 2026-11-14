# RegMeUp engineering baseline

Version 0.4 — 11 November 2026 (Asia/Bangkok)

เอกสารชุดนี้เป็น baseline สำหรับ design และ feature review [PR #2](https://github.com/JeffMerry/reg-me-up/pull/2) ได้รับ approval และ merge แล้ว; SYS-01 foundation เริ่มพัฒนาบน `chore/sys-01-foundation` และมี [ผลตรวจบางส่วน](sprints/sprint-1/sys-01-evidence.md) ส่วน F-04 มี implementation และผลตรวจขอบเขต feature แล้วตาม [F-04 verification](sprints/sprint-1/f-04-evidence.md); shared verification และ teammate review ยัง pending

| Part | Artifact | สถานะ |
|---|---|---|
| A | [SRS](srs.md) | Requirements และ decision register จัดทำแล้ว; pending teammate review |
| B | [Feature inventory](features.md), [Traceability](traceability.md) | ครบ baseline allocation; actual results ยัง NOT RUN |
| C | [System SDS](system-sds.md) | Selected design พร้อม parameters/API/data conventions; pending teammate review |
| D | [Three-sprint plan](sprints/plan.md), [Sprint 1 branch/PR plan](sprints/sprint-1/branch-plan.md) | ผู้ใช้เลือก Feature → sprint/01-staging → main; teammate review และการดำเนิน workflow ยัง pending |
| E | [F-01](sprints/sprint-1/f-01.md), [F-02](sprints/sprint-1/f-02.md), [F-03](sprints/sprint-1/f-03.md), [F-04](sprints/sprint-1/f-04.md) and [F-04 evidence](sprints/sprint-1/f-04-evidence.md) | Feature contracts and actual evidence; broader F-04 shared verification/review pending |
| E | [STS](sprints/sprint-1/sts.md), [Definition of Done](sprints/sprint-1/dod.md) | Test design จัดทำแล้ว; ทุก verification NOT RUN |
| UI | [UI specification](ui-spec.md) | Baseline เดิม; teammate review ยัง pending |
| SYS-01 | [Foundation contract](sprints/sprint-1/sys-01.md), [Dependency versions](dependency-versions.md), [Issue #1](https://github.com/JeffMerry/reg-me-up/issues/1) | Foundation in progress; actual partial checks/remaining work อยู่ใน evidence; implementation PR review ยัง pending |
| Lab 5 | [Deployment guide](labs/lab-05/deployment.md), [Cloud readiness](labs/lab-05/lab5-cloud-readiness.md), [Docker contract](labs/lab-05/lab5-docker-contract.md), [Docker evidence](labs/lab-05/lab5-docker-evidence.md), [CI contract](labs/lab-05/ci-contract.md) และ [CI evidence](labs/lab-05/ci-evidence.md) | สถานะและหลักฐานแต่ละขั้นอยู่ในเอกสาร; Cloud deployment และ required check ยังไม่ยืนยัน |

เลือก React/TypeScript/Vite + Tailwind, Express/TypeScript และ PostgreSQL ผ่าน **Prisma ORM และ Prisma Migrate** โดยใช้ parameterized SQL สำหรับ event row lock ตาม [DEC-14](srs.md) การรับแนวทางในแชตเป็นคนละรายการกับ teammate review/PR approval ไม่มีการใส่ชื่อ reviewer หรือ Issue/PR ที่ยังไม่เกิดขึ้น

อ่านตามลำดับ A → B → C → D → contract ของ feature → STS/DoD เอกสาร [readiness review](planning/sprint-1-readiness.md) เป็น snapshot ก่อนชุดนี้ และ [proposal](planning/sprint-1-proposal.md) เป็นประวัติข้อเสนอ; decision ปัจจุบันอ้าง [SRS](srs.md) และรายละเอียดทางเทคนิคอ้าง System SDS

Course references ยังคงอยู่ใน [references/](references/) ต้นฉบับไม่ถูกแก้ไข ข้อขัดแย้งถูกบันทึกใน SRS; exact Prisma package versions, GitHub board และ review records ยังต้องจัดทำจริงก่อนใช้ release workflow ตรวจ version ของ contract/test design จาก Git history ของไฟล์นั้น เช่น `git log -- docs/sprints/sprint-1/f-01.md` และอ้าง commit จริงเมื่อจัดทำหลักฐาน ไม่ใช้เอกสารเป็นหลักฐานว่า teammate review หรือ implementation เกิดขึ้นแล้ว

Deliverable 1 ต้องมี self-contained PDF Parts A–F พร้อมหลักฐานจริง รายการข้างต้นยังไม่ใช่ PDF submission หรือหลักฐาน Part F
