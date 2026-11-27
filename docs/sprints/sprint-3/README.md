# Sprint 3 contracts and Deliverable 2 checkpoint

27 November 2026 (Asia/Bangkok). Refs #44/#45. Owner of remaining implementation/migrations/tests/integration/release evidence: Kittithat Disthanakornkun (JeffMerry). Peer reviewer: Thanatip Nitinantakul (THN4). **Contracts prepared for review; F07/F08 implementation and tests NOT RUN.** Historical F09 work remains credited to THN4.

## User-confirmed Q09 policy

Confirmed in chat on27Nov2026 before this contract revision:

- F07: only own-event ACTIVE registrations; start≤server now<end; repeated check-in keeps original attendance/time; no attendance edit/undo.
- F08: counts are unique people per event, using current status. Registered = distinct participants with ACTIVE; cancelled = distinct participants with CANCELLED history and no ACTIVE for that event; attended = distinct participants with persisted attendance. A participant who cancelled then re-registered counts registered1/cancelled0. Attended is a subset of registered under the current immutable lifecycle, not another disjoint bucket.
- Registration IDs/history remain unchanged; counting people does not merge/delete old registrations or change seat rules. UI must label units as people. These user confirmations do not replace technical contract/implementation review.

Example: P1 cancelled twice then has a new ACTIVE registration and attends; P2 cancelled with no ACTIVE; P3 ACTIVE without attendance. Counts registered2/cancelled1/attended1. The two cancellations by P1 do not count two people or add P1 to cancelled.

## Reviewable documents

- [F07 check-in contract and Feature SDS](f-07.md)
- [F08 report contract and Feature SDS](f-08.md)
- [Test specification with exact planned IDs](sts.md)
- [Definition of Done](dod.md)
- [Sprint2 acceptance gaps](../sprint-2/acceptance-audit.md)
- [Delivery/release evidence plan](../deliverable-2/plan.md)

## D2 workflow checkpoint

Implement a meaningful F07 workflow: owner opens a persisted eligible roster, checks in an ACTIVE registration in the allowed window, sees saved attendance after reload/new app process, and demonstrates an ineligible/boundary/forbidden API rejection. Include repeated/concurrent requests without duplicate attendance. This is a tested progress checkpoint, not permission to skip the rest of the contracted F07 criteria.

F08 has a full contract here. Implementation status remains NOT STARTED until a real branch/test/source exists. Owner report workflow may be implemented after F07 if time permits; do not fabricate screenshots or mark report criteria passed from planning. Remaining F07/F08 work must retain criteria, owner and target through13Dec2026 in the delivery plan.

Workflow: docs PR from staging → THN4 technical review → feature/f-07-check-in from reviewed staging → RED → GREEN → PR/review/CI → integrated candidate → reviewed main/release evidence. Release evidence is now owned by JeffMerry, not a dependency assigned to a future teammate action. No self-approval or automatic submission/deployment follows from this plan.
