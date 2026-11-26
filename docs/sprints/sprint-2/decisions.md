# Sprint 2 decisions and Lab 7 coordination

Version 0.2 — 26 November 2026. Refs #40/#41/#42/#43/#51. **POLICY CONFIRMED; NOT IMPLEMENTED / NOT RUN.** THN4 confirmed Q-04–Q-08 and associated FR/BR in [review6068033006](review-record.md); GitHub state COMMENTED, not APPROVED. Ownership is recorded in the [matrix](review-record.md#ownership-matrix). This follow-up still requires review/approval before merge; confirmation is not runtime acceptance.

## Confirmed policy

| Question | Confirmed decision | Important boundaries |
|---|---|---|
| Q-04 deadline | API/DB UTC instants; UI Asia/Bangkok. Optional registration deadline. Effective registration cutoff is deadline when set, otherwise event startsAt | Require deadline <= startsAt. Accept only server decision time < cutoff; equality is closed. No null deadline means unlimited post-start registration |
| Q-05 cancellation | Participant may cancel own ACTIVE registration before startsAt; successful cancellation returns the seat immediately on commit; re-registration creates a new row before registration cutoff | Preserve cancelled row/ID/time. Repeated cancel of own already-cancelled row succeeds without another state change, even after cutoff. A later ACTIVE row is never cancelled by an old ID |
| Q-06 editing | Owner edits title, start/end, location, description, capacity and deadline before the existing event start | Proposed start must remain future; end > start; effective deadline policy applies. Capacity >= ACTIVE count under lock. No owner/publication-status edits, deletes or unpublish |
| Q-07 assignment | At most one current Instructor per event; owner can assign/replace/remove before the event starts | Keep assignment history. Same Instructor assignment is a no-op; removing an already-empty assignment is a no-op, subject to write preconditions |
| Q-08 identity / overlap | One role per account: PARTICIPANT, ORGANIZER or INSTRUCTOR. Instructor does not gain registration/organizer rights | Reject overlapping current teaching assignments: intervals [startsAt, endsAt), so exact end/start adjacency is allowed. Event time edits must run the same overlap check |

The reviewer confirmed the policy scope and preserved invariants. Exact endpoint/DTO/error/lock/version mechanics in system-design.md remain technical design to verify in implementation PRs. This does not reopen the confirmed policy.

## Capacity: ownership and confirmed edit scope

Lab 7 remains owned by the other workstream: BR-01/DEC-05 and F-02 create validation/tests. This Sprint 2 revision does not modify those source rules or implement the 1–60 limit. The new announcement removes the TA/Instructor approval gate; it does not establish teammate review, RED/GREEN, or a deployed change.

F-06 is CONFIRMED to require integer1–60 for **an explicitly supplied capacity update** together with capacity >= ACTIVE count. Keep this edit contract distinct from the currently implemented create range. Link the actual Lab 7 Issue/contract/test/merge commits when available; do not create fake references.

### Confirmed legacy policy

1. Audit events with capacity >60 and ACTIVE counts on the intended database using a read-only authorized query before choosing DB enforcement. No audit was run for this draft.
2. Preserve stored legacy capacity, registrations, IDs and ownership. Existing published events remain readable and registrable up to their stored capacity, subject to Sprint 2 cutoff.
3. A PATCH that omits capacity may edit other permitted fields on a legacy event without forcing capacity down to60. If capacity is present, enforce the approved new range even if the number is unchanged.
4. If ACTIVE >60, changing capacity into1–60 is impossible until ACTIVE permits it; do not auto-cancel users or truncate capacity. Other permitted edits remain available.
5. Retain DB capacity >0 unless the team approves a compatible enforcement/migration design. Do not add a global <=60 constraint to a table retaining legacy >60 values.

The legacy policy above is **CONFIRMED** by the linked THN4 review: preserve data and omitted capacity; explicitly supplied capacity must satisfy the new range/ACTIVE guard; no incompatible global constraint. The audit requirement remains outstanding; policy confirmation is not proof that a data query or migration was executed.

## Preserved behavior

Backend session/role/owner/CSRF checks remain authoritative. Forged organizerId in create/edit is422/no write, not201 with silently ignored ownership. Duplicate registration remains409 ALREADY_REGISTERED before full/cutoff conflicts for an existing own ACTIVE row. Remaining seats = stored capacity minus ACTIVE rows; cancellation never increases stored capacity. Public DTOs never contain private registration or assignment history.

## Follow-up review and implementation checks

- Q-04–Q-08 and legacy policy are confirmed; verify implementation preserves the specified precedence and no-write guarantees.
- Verify single Instructor, overlap serialization and event-edit interactions across both features.
- Review actual additive migrations, historical visibility and no-op version implementation.
- Review the user-directed named ownership matrix and this follow-up before merge. Retain the actual COMMENTED review record; AI analysis and policy confirmation are not formal PR APPROVED.
