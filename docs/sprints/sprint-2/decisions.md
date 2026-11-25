# Sprint 2 decisions and Lab 7 coordination

Version 0.1 — 25 November 2026. Refs #40/#41/#42/#43. **User-selected drafting policy; teammate review pending.** Do not mark source Q-04–Q-08 CLOSED or implement these rules until the relevant contract has received the required teammate review.

## Policy selected for the draft

| Question | Draft decision | Important boundaries |
|---|---|---|
| Q-04 deadline | API/DB UTC instants; UI Asia/Bangkok. Optional registration deadline. Effective registration cutoff is deadline when set, otherwise event startsAt | Require deadline <= startsAt. Accept only server decision time < cutoff; equality is closed. No null deadline means unlimited post-start registration |
| Q-05 cancellation | Participant may cancel own ACTIVE registration before startsAt; successful cancellation returns the seat immediately on commit; re-registration creates a new row before registration cutoff | Preserve cancelled row/ID/time. Repeated cancel of own already-cancelled row succeeds without another state change, even after cutoff. A later ACTIVE row is never cancelled by an old ID |
| Q-06 editing | Owner edits title, start/end, location, description, capacity and deadline before the existing event start | Proposed start must remain future; end > start; effective deadline policy applies. Capacity >= ACTIVE count under lock. No owner/publication-status edits, deletes or unpublish |
| Q-07 assignment | At most one current Instructor per event; owner can assign/replace/remove before the event starts | Keep assignment history. Same Instructor assignment is a no-op; removing an already-empty assignment is a no-op, subject to write preconditions |
| Q-08 identity / overlap | One role per account: PARTICIPANT, ORGANIZER or INSTRUCTOR. Instructor does not gain registration/organizer rights | Reject overlapping current teaching assignments: intervals [startsAt, endsAt), so exact end/start adjacency is allowed. Event time edits must run the same overlap check |

Only the high-level policy set was selected by the user; exact endpoint/DTO/error/lock/version details are proposed in system-design.md for teammate review.

## Capacity: ownership and unresolved scope

Lab 7 remains owned by the other workstream: BR-01/DEC-05 and F-02 create validation/tests. This Sprint 2 draft does not modify those source rules or implement the 1–60 limit. The new announcement removes the TA/Instructor approval gate; it does not establish teammate review, RED/GREEN, or a deployed change.

F-06 proposes integer 1–60 for **an explicitly supplied capacity update** together with capacity >= ACTIVE count. Keep the proposal distinct from the currently implemented create range. Link the actual Lab 7 Issue/contract/test/merge commits when available; do not create fake references.

### Legacy policy proposed for joint review

1. Audit events with capacity >60 and ACTIVE counts on the intended database using a read-only authorized query before choosing DB enforcement. No audit was run for this draft.
2. Preserve stored legacy capacity, registrations, IDs and ownership. Existing published events remain readable and registrable up to their stored capacity, subject to Sprint 2 cutoff.
3. A PATCH that omits capacity may edit other permitted fields on a legacy event without forcing capacity down to60. If capacity is present, enforce the approved new range even if the number is unchanged.
4. If ACTIVE >60, changing capacity into1–60 is impossible until ACTIVE permits it; do not auto-cancel users or truncate capacity. Other permitted edits remain available.
5. Retain DB capacity >0 unless the team approves a compatible enforcement/migration design. Do not add a global <=60 constraint to a table retaining legacy >60 values.

These five details are **proposed, not confirmed team policy**. Resolve them jointly before F-06 capacity implementation or Lab 7 DB constraint work.

## Preserved behavior

Backend session/role/owner/CSRF checks remain authoritative. Forged organizerId in create/edit is422/no write, not201 with silently ignored ownership. Duplicate registration remains409 ALREADY_REGISTERED before full/cutoff conflicts for an existing own ACTIVE row. Remaining seats = stored capacity minus ACTIVE rows; cancellation never increases stored capacity. Public DTOs never contain private registration or assignment history.

## Contract questions for reviewer

- Confirm Q-04–Q-08, the legacy proposal and precedence of edit version conflicts versus domain validation.
- Confirm single Instructor, overlap serialization and event-edit interactions across both features.
- Confirm additive schema, historical visibility and no-op version semantics.
- Record actual reviewer/date/findings/resolutions in the PR. Chat policy selection and AI analysis are not teammate approval.
