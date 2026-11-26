# Lab 7 release handoff — Issue #54

สถานะ: **เตรียม release; NOT READY สำหรับการส่งมอบรุ่น deploy** ณ 26 พ.ย. 2026 22:21 Asia/Bangkok ยังไม่เปิด/merge release PR, ไม่ deploy และไม่มีผล post-deploy ของ Lab7 ในชุดหลักฐานนี้

Branch `docs/lab7-release-evidence` เริ่มจาก `c9fb599` ซึ่งเป็น merge ของ [PR #60](https://github.com/JeffMerry/reg-me-up/pull/60) เข้า `lab7-staging`; working tree เริ่มต้นสะอาด Issue prerequisite คือ [#53](https://github.com/JeffMerry/reg-me-up/issues/53), contract คือ [#52](https://github.com/JeffMerry/reg-me-up/issues/52) และ release คือ [#54](https://github.com/JeffMerry/reg-me-up/issues/54)

## 1. Version trace

| จุดอ้างอิง | Version / หลักฐาน | ความหมาย |
|---|---|---|
| Accepted Sprint1 baseline | `3eba355215f0689d2a00553b0e0ed7a4cbecd457`, `regmeup-00007-6zj` | อ้างจาก Lab06; ไม่ใช่ pre-change SHA |
| Actual pre-change | `3c8b751a2646408f6fdc88209a0fef33d9030f1b`, recorded revision `regmeup-00008-5ws` | Validator เดิมรับ integer1–2147483647; ยังไม่อ้างว่า revision นี้เป็น current live revision |
| Reviewed contract | PR#56 head `339ecd3`; merge `370bae0`; JeffMerry review 26พ.ย.19:49 Asia/Bangkok | Review ก่อน implementation |
| Original unit RED | `d8b0d18`, 20:10:15; 61 passed/2 failed | Test ใหม่คาด reject61/old maximum บน validator เดิม |
| Production implementation | `db09ba6`; unit GREEN 63 passed | Client/server limit1–60; no schema migration |
| Integration RED reproduction | `db09ba6` + temporary old server validator, 20:53:44 | เป็น reproduction ภายหลัง ไม่ใช่ test บน original RED commit; คืนไฟล์แล้ว |
| Legacy/UI follow-up sources | `10f8c2d` + then-uncommitted tests; ต่อมา commit `d59d559` และ `b00a210` | 44 integration/15 F02 browser passed ก่อน commit test changes; ไม่อ้างว่ารันบน merge SHA |
| Implementation review/integration | PR#60 head `06e89b3`; merge `c9fb599`; merged26พ.ย.21:57:58 | Review APPROVED แต่มีข้อความให้แก้ CI trigger; ยังไม่พบ run ของ implementation head |
| Current evidence branch base | `c9fb59992ae8bc7ba9b7762e1b4c49ef4273be40` | รวม Lab7 docs/code/tests; ไม่มี Sprint2 feature ที่ใช้เป็น maintenance evidence |
| Reviewed main release | PENDING | เติม full main merge SHA/tag หลัง merge จริง |
| Lab7 deployment | PENDING | เติม runID, image digest, revision, traffic, URL, timestamp หลัง deploy |

## 2. CI gap และลำดับ release

Workflow `.github/workflows/ci-docker.yml` เดิมรัน PR ไป `lab5-staging`/`main` จึงไม่มี PR-triggered run สำหรับ #60 ที่ target เป็น `lab7-staging` ใน source snapshot ที่ตรวจได้ Review ของ JeffMerry ระบุให้เพิ่ม branch ก่อน merge; PR ถูก merge แล้วโดยยังไม่ได้เปลี่ยน trigger การแก้ใน branch นี้เพิ่ม `lab7-staging` และคง checks เดิมทั้งหมด ไม่อ้างย้อนหลังว่า PR#60 ผ่าน CI

1. ผู้ใช้ตรวจ/commit workflow fix และ release evidence แยกชุด แล้ว push branchนี้ เปิด PR เข้า `lab7-staging`
2. ให้ teammate review และเก็บ CI run/check ที่ทดสอบ final PR head หรือ merge candidate จริง หากไม่เกิด run อัตโนมัติหลังเปิด PR ให้บันทึกเหตุผลและรัน CI workflow บน head นี้ผ่าน Actions; ต้องตรวจ tested SHA ห้ามถือว่า workflow_dispatch บน main เก่าตรวจ branch นี้
3. Merge evidence/CI PR หลัง review/CI ผ่าน อัปเดต staging ในเครื่อง เปิด reviewed release PR จาก `lab7-staging` ไป `main`
4. Release PR ต้องผ่าน CI และ teammate review บน candidate ล่าสุดก่อน merge การ merge เข้า `main` จะเรียก **Deploy demo** อัตโนมัติ จึงตรวจ configuration และแผนเก็บ evidence ให้พร้อมก่อน merge
5. Pipeline เดิมเรียก reusable CI, build/push image, resolve digest, รัน migration job และ deploy Cloud Run แล้วส่ง traffic ไป latest ไม่ต้องรัน local seed หรือแก้ applied migration
6. หลัง pipeline สำเร็จให้ผู้ใช้ตรวจ post-deploy ตามตารางด้านล่าง เก็บผลจริงก่อนเปลี่ยน readiness เป็น READY การตรวจ public endpoint ใน pipeline อย่างเดียวไม่พิสูจน์กฎ1–60
7. Sync release `main` เข้า `sprint/02-staging` ผ่าน reviewed PR แยก ประสาน #42/#45; ไม่ merge Sprint2 เข้า maintenance branch เพื่อกลบปัญหา integration และไม่ทำ force push

ไม่สร้าง tag/merge/deploy อัตโนมัติในขั้นเตรียมนี้ ผู้ใช้เป็นผู้รัน checks และเก็บภาพตาม workflow ที่ตกลง

## 3. Deployment evidence ที่ต้องเก็บ

| Evidence ID | เนื้อหาที่ต้องเห็น | สถานะ |
|---|---|---|
| L7-R01 | Release PR: base main, final head SHA, reviewer/date/comment, checks ของ candidate | PENDING |
| L7-R02 | CI workflow/runID, event/ref/headSHA, outcomes และสรุป suite counts จาก logs | PENDING |
| L7-R03 | Main merge SHA และ Deploy demo run URL/ID; migration execution outcome | PENDING |
| L7-R04 | Full commit image tag → immutable image digest → ready Cloud Run revision → traffic allocation → service URL/time | PENDING |
| L7-R05 | Expected/actual smoke records และ event/registration IDs บน deployed revision เดียวกัน | NOT RUN |
| L7-R06 | Post-release integration PR เข้า sprint/02-staging และ feedback #42/#45 | PENDING |

ใน Actions > Deploy demo ดู step summary: มี commit image tag, immutable image และ URL แต่ยังไม่มี revision ใน summary ให้ตรวจ revision/traffic แยกด้วย CMD ที่ติดตั้งและ login gcloud ไว้แล้ว คำสั่งต่อไปอ่าน service metadata เท่านั้น:

```cmd
gcloud run services describe regmeup --project=cpe334-reg-me-up-513615 --region=asia-southeast1 --format="yaml(status.url,status.latestCreatedRevisionName,status.latestReadyRevisionName,status.traffic)"
```

นำ ready revision ที่ได้จริงมาแทน `ACTUAL_READY_REVISION`:

```cmd
gcloud run revisions describe ACTUAL_READY_REVISION --project=cpe334-reg-me-up-513615 --region=asia-southeast1 --format="yaml(metadata.name,status.imageDigest,status.conditions)"
```

อย่าใช้ `gcloud ... --format=json` ทั้ง service เพราะอาจมี environment values ไม่ต้องเปิด Secret Manager values เพื่อเก็บหลักฐาน ตรวจว่า digest/revision ที่รับ traffic สอดคล้องกับ deploy run จริง ถ้ารันไม่ได้ให้เก็บหน้า Cloud Run revision/traffic ที่มีข้อมูลเดียวกัน

## 4. Post-deploy manual checks — ผู้ใช้รันเอง

ใช้ synthetic demo accounts ที่มีอยู่แล้ว เก็บ deployed revision, เวลา Asia/Bangkok, expected/actual, HTTP result, IDs และชื่อผู้ทดสอบทุกแถว เปลี่ยน PENDING เป็น PASS/FAIL/BLOCKED ตามจริง:

| ID | Action / setup | Expected | Actual / evidence |
|---|---|---|---|
| PD01 | เปิด deployed `/api/health`, `/api/ready`, `/api/events` และหน้าเว็บ | HTTP200 และบริการพร้อม; ไม่ใช่หลักฐาน capacity | NOT RUN |
| PD02 | Organizer publish title `LAB7-<run>-CAP1`, capacity1; GET/reload/anonymous detail | 201; stored capacity1; ownerจาก session | NOT RUN |
| PD03 | ทำแยกด้วย capacity60 | 201; GET/reloadแสดง60 | NOT RUN |
| PD04 | ฟอร์ม capacity61; จากนั้นส่ง POST61 โดยตรงผ่าน authenticated browser/CSRF | UI field error; API422 VALIDATION_ERROR + fieldErrors.capacity; owner event countเท่าเดิม | NOT RUN |
| PD05 | Participant register eventPD02 แล้ว reload own registration | 201; ID/owner/eventเดิม; ACTIVE1/remaining0 | NOT RUN |
| PD06 | Participant เดิมส่ง registerซ้ำ; ถ้ามี synthetic Participantอีกคนให้ลอง eventเต็ม | duplicate409 ALREADY_REGISTERED; คนใหม่409 EVENT_FULL; countsไม่เพิ่ม | NOT RUN; หากไม่มีบัญชีคนที่สองให้บันทึก BLOCKED สำหรับ subcaseนั้น |
| PD07 | Participant publish API และ anonymous publish API | 403 /401; no event created (anonymous actionต้องผ่าน transport/CSRFตาม contractก่อนตรวจ auth) | NOT RUN |
| PD08 | Organizerที่ไม่ใช่เจ้าของอ่าน private registrations; Participantอ่าน registrationของคนอื่น | safe404; public detailยังอ่านได้ | NOT RUN; ต้องมี authorized synthetic second owner/record มิฉะนั้น BLOCKED |
| PD09 | Read-only target inventory ของ events>60; ถ้ามีให้ GET/public/ownerอ่านข้อมูลและเทียบ stored values | ไม่ clamp/เขียนข้อมูลเก่า; ถ้าไม่พบให้บันทึก0พร้อมidentity ไม่สร้างlegacy61ใหม่ผ่านDBของliveเพื่อให้มีหลักฐาน | NOT RUN |

API61 ควรทำผ่าน DevTools ของหน้า deployed app ขณะ login Organizer เพื่อไม่ติด client validation ตัวอย่างต่อไปอ่าน count ก่อน/หลังและพิมพ์เฉพาะค่าที่เป็น evidence (ไม่พิมพ์ cookie/token):

```javascript
await (async () => {
  const beforeResponse = await fetch('/api/me/events');
  if (!beforeResponse.ok) throw new Error('Login as Organizer first');
  const before = (await beforeResponse.json()).meta.total;
  const boot = await fetch('/api/auth/csrf', { cache: 'no-store' });
  if (!boot.ok) throw new Error('CSRF bootstrap failed');
  const token = (await boot.json()).data.csrfToken;
  const title = `LAB7-${Date.now()}-INVALID61`;
  const startsAt = new Date(Date.now() + 86400000).toISOString();
  const endsAt = new Date(Date.now() + 90000000).toISOString();
  const response = await fetch('/api/events', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': token },
    body: JSON.stringify({ title, startsAt, endsAt, location: 'Synthetic Lab7 check', capacity: 61 })
  });
  const body = await response.json();
  const afterResponse = await fetch('/api/me/events');
  if (!afterResponse.ok) throw new Error('Unable to read post-check count');
  const after = (await afterResponse.json()).meta.total;
  console.table({ title, status: response.status, code: body.error?.code,
    capacityError: body.error?.fieldErrors?.capacity, before, after,
    matchesExpected: response.status === 422 && !!body.error?.fieldErrors?.capacity && before === after });
})();
```

หาก testล้มเหลวและเกิด event จริง อย่ารันซ้ำโดยไม่จด ID/ชื่อเพื่อหลีกเลี่ยง synthetic rowsเพิ่ม การเทียบ owner countใช้ช่วงที่ไม่มีผู้ทดสอบอื่นสร้าง eventด้วย ownerเดียวกัน; ถ้ามีให้ระบุข้อจำกัดและตรวจ unique titleผ่านรายการ owner เพิ่ม

## 5. Synthetic fixture ledger / data handling

| Run / owner | Event ID / title / capacity | Registration ID / role | Created at / revision | Disposition |
|---|---|---|---|---|
| PENDING | PENDING | PENDING | PENDING | PENDING |

ระบบ maintenance รุ่นนี้ไม่มี delete/unpublish/cancel workflow ที่ตกลงไว้สำหรับข้อมูลเหล่านี้ ให้ใช้ข้อมูลสังเคราะห์จำนวนจำกัด ตั้งชื่อชัดเจน บันทึก IDs และคงไว้ให้ TA ตรวจจนจบการประเมิน Cleanup ภายหลังต้องเป็นงานที่ทีมยืนยันและมี review; ไม่ reset/reseed deployment DB, ไม่แก้ ownership/capacity/registrationsของข้อมูลเดิมเพื่อทำให้smokeผ่าน

## 6. Scope and next commit/review checkpoints

รอบนี้จัดทำเฉพาะ Markdown, source records และ CI configuration ใน repository ตามคำขอของผู้ใช้ Google Doc, การจัดหน้า/ฝังภาพในรายงาน, PDF export และการส่ง LEB2 เป็นงานแยกภายหลัง ไม่ใช้เป็นเงื่อนไขของการตรวจ PR ชุดนี้ และไม่อ้างว่าดำเนินการแล้ว

1. `ci: run verification for lab7 staging pull requests` — เฉพาะ CI trigger
2. `docs: address Lab7 contract review feedback` — F-03 version/date และ traceability ที่เชื่อมผลจริง
3. `docs: prepare Lab7 release metrics and smoke handoff` — JSON source snapshot, metrics/readiness และเอกสารนี้
4. เปิด PR เอกสาร/CI เข้า staging ให้ review แล้วจึง release PR; หลักฐาน post-deploy และ final metrics เป็น commit รอบหลัง พร้อม actual SHA/run/revision ไม่เติมผลคาดหวังเป็นผลจริง
