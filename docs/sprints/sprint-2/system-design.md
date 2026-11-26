# Sprint 2 shared system design

Version 0.2 — 26 November 2026. **Policy CONFIRMED; implementation NOT STARTED / verification NOT RUN.** [THN4's COMMENTED review and named ownership](review-record.md) cover the policy/legacy scope. Technical implementation details and this follow-up still require relevant review/approval. Extends [System SDS](../../system-sds.md); policy source [decisions](decisions.md). Refs #40–#43/#51. Shared schema owner: Thanatip Nitinantakul (THN4), reviewer Kittithat Disthanakornkun (JeffMerry); shared lock owner: Kittithat, reviewer Thanatip.

## 1. Compatibility and schema ownership

Keep PostgreSQL/Prisma, existing session/CSRF infrastructure, event/registration UUIDs, ACTIVE partial unique index, public DTO allowlist and event-lock mechanism. No dependency upgrade is planned. Do not edit applied migrations or seed/reset a database to make migration pass.

| Table | Proposed additive change | Compatibility / verification |
|---|---|---|
| users | Extend role CHECK to allow INSTRUCTOR | One role string per account; retain existing accounts/passwords and deny new role from Organizer/Participant APIs |
| events | registration_deadline timestamptz nullable; version integer NOT NULL DEFAULT0 | Existing events get null/0. CHECK deadline IS NULL OR deadline <= starts_at; version >=0. No capacity upper-bound migration in this proposal |
| registrations | Allow CANCELLED; cancelled_at timestamptz nullable | Existing ACTIVE rows unchanged. CHECK ACTIVE=>cancelled_at null, CANCELLED=>cancelled_at nonnull. Keep existing ACTIVE-pair unique index; every successful re-registration uses new UUID |
| instructor_assignments | id UUID, event_id FK RESTRICT, instructor_id FK RESTRICT, assigned_at timestamptz, ended_at nullable | Partial unique current assignment per event (ended_at IS NULL); index instructor/current/event; end>=assigned. Validate INSTRUCTOR role in service. Never delete historical assignments on replace/remove |

Review exact SQL/index names against existing schema before writing migrations. Each feature owns a new ordered migration on its branch; rebase/merge prerequisites without rewriting deployed history. Assignment overlap spans events and must be enforced by serialized service transactions, not a per-row CHECK. Assignment replacement and event edits share the schedule mutex below. Apply preflight-protected migrations to isolated DB; repeat apply and verify old rows/IDs/constraints before deployment. Recovery must be reviewed against actual failure; do not claim a generic down script is safe.

## 2. Mutation protocol and clock

All mutation endpoints require authenticated correct role, Origin/CSRF, JSON body and strict allowlisted fields before domain writes. Private lookup non-owner/missing gives404 with no private metadata. Invalid input is422 VALIDATION_ERROR with fieldErrors; unknown fields are rejected. Contention follows existing503 TEMPORARILY_UNAVAILABLE/rollback and OUTCOME_UNKNOWN conventions; never auto-retry uncertain mutations in UI.

Use READ COMMITTED transactions and bound lock/statement/transaction timeouts as in Sprint1. Sample an injected trusted server clock **after required locks are obtained**, once per operation. Tests control clock/lock synchronization without a public test endpoint.

### Registration and cancellation

1. Registration: event FOR UPDATE; find own existing ACTIVE first (409 ALREADY_REGISTERED with own ID); then check now>=effective cutoff (409 REGISTRATION_CLOSED), then count>=capacity (409 EVENT_FULL); insert ACTIVE only after all checks.
2. Cancellation: validate own registration (safe404 otherwise) and identify its event, then event FOR UPDATE and re-read the same own row. If CANCELLED, return200 unchanged. If ACTIVE and now>=startsAt, return409 CANCELLATION_CLOSED. Otherwise update status/CANCELLED timestamp atomically. No stored seat counter. Read no-op does not cancel a later row.
3. All count/capacity writers hold the event lock; never use a pre-lock count or a separate root Prisma client within the transaction.

### Owner edits and Instructor scheduling

Proposed deliberately coarse correctness-first protocol: F-06 PATCH and F-09 PUT/DELETE first acquire one shared PostgreSQL transaction advisory lock identified by a documented constant, then lock the target event. This serializes schedule mutations across events, avoiding overlap-check races. Registration/cancellation take only their event lock and never wait for the schedule mutex while holding it. No inverse lock order is permitted. Record throughput tradeoff as design debt to reconsider if required; no invented load SLA.

The [shared lock implementation candidate/evidence](shared-lock-evidence.md) supplies `withEventWrite` in `server/src/event-write.ts`. Use scope:'schedule' for F-06/F-09 and the same two-int advisory key namespace334/key2. Event scope defaults to row-only. The callback must perform ownership/domain checks and sample server time after locks using its tx. Missing/excluded row returns found:false; response/privacy mapping remains caller-owned. Candidate review/merge is required before feature consumers integrate it; this does not establish overlap/deadline/cancellation implementation.

Under locks: owner check → expectedVersion check → existing event not started → sample/validate proposed values and Instructor overlap → update/history → increment version on real changes → commit. A stale version returns409 EVENT_CHANGED and no writes; caller reloads and re-confirms, never silently overwrites another owner's edit. Different owner is checked before returning any version. A permitted no-op validates preconditions and returns current version without history/version increment. Invalid operations never partially update capacity/deadline/assignment.

F-06 must check current Instructor against other **current** assignments when startsAt/endsAt change. F-09 assignment must check instructor role and half-open overlap against other event times. Query excludes target event and historical ended assignments. Serialize both paths with the same mutex so assign and edit cannot bypass one another. Do not expose competing event IDs/details in conflict errors.

## 3. API contract

Identifiers use strict UUID validation and pagination follows current page/pageSize20/max100 conventions. Auth/session/CSRF failures preserve existing401/403 behavior. All timestamps use ISO8601 with Z/offset at input, UTC output and Asia/Bangkok UI. No email/hash/session fields in new DTOs.

| Method/path | Request / authorization | Response / conflicts |
|---|---|---|
| POST /api/me/registrations/:registrationId/cancel | Participant owns row; body{} | 200 own registration DTO including status and nullable cancelledAt; repeat200 unchanged;409 CANCELLATION_CLOSED |
| GET /api/organizer/events/:eventId | Owner Organizer | 200 owner edit DTO: existing event public fields + registrationDeadline, effectiveRegistrationCutoff, version, current Instructor{id,displayName} or null |
| PATCH /api/organizer/events/:eventId | Owner Organizer; expectedVersion required; at least one of title/startsAt/endsAt/location/description/capacity/registrationDeadline | 200 owner edit DTO;422 field validation;409 EVENT_CHANGED / EVENT_STARTED / CAPACITY_BELOW_ACTIVE / INSTRUCTOR_UNAVAILABLE |
| GET /api/organizer/instructors | Organizer; page/pageSize only | 200 paginated directory of Instructor{id,displayName}; do not expose email or other-role accounts |
| PUT /api/organizer/events/:eventId/instructor | Owner Organizer; body{instructorId,expectedVersion} | 200 owner edit DTO;422 assignee absent/wrong role (same nonleaking validation);409 EVENT_CHANGED/EVENT_STARTED/INSTRUCTOR_UNAVAILABLE |
| DELETE /api/organizer/events/:eventId/instructor | Owner Organizer; JSON body{expectedVersion}, CSRF | 200 owner edit DTO with null Instructor; same timing/version guards |
| GET /api/me/teaching-events | Instructor; page/pageSize | 200 paginated current assigned events, startsAt/id ASC; empty success is distinct from error |
| GET /api/me/teaching-events/:eventId | Assigned Instructor | 200 teaching DTO; missing/unassigned404 |

PATCH omissions preserve stored values; explicit null only allowed for nullable description/deadline. Do not run whole create validation on a partial body before merging with stored fields. Validate resulting full event time/required fields under lock. Explicit capacity updates use confirmed F-06 range1–60; omitted legacy capacity is preserved as decisions.md. Lab7 create integration remains separately traceable. owner/IDs/publicationStatus/version directly supplied outside the allowed expectedVersion are422.

Edit deadlines may be past (immediately closed) but cannot be after the proposed startsAt. Existing and proposed starts must be > decision time for editing; otherwise reject with a domain/field error as specified in tests. Null deadline is not an unlimited registration period: effective cutoff=startsAt.

## 4. DTO/read model evolution

- PublicEvent add registrationDeadline nullable and effectiveRegistrationCutoff. Never add private assignment history or owner edit version to public DTO. Update nested EventPublic readers/tests explicitly; existing exact-field allowlist tests must be revised with the documented new public fields, not weakened.
- OwnRegistration adds cancelledAt nullable and supports ACTIVE/CANCELLED; own list shows history, existing order registeredAt/id DESC. Client keys by registrationId, not eventId. Cancelled row detail stays retrievable by its owner.
- Owner registrant list and summary remain ACTIVE-only; cancelled registrations do not consume seats or appear in that list. Sprint3 report counting is separate Q-09 work.
- Teaching DTO: id/title/start/end/location/description, public capacity/remaining/cutoff fields and Organizer displayName; no registrants, assignment history, email or management capabilities.
- Private owner/teaching responses keep no-store and must clear cached state on logout/expiry/access change. Public accessibility remains unchanged. ReturnTo allowlist must add valid owner edit and Instructor teaching routes with role checks.

## 5. UI / provisioning / unaffected layers

See [UI extension](../../ui-spec.md#sprint-2-extension--confirmed-policy). Extend frontend identity union/navigation to INSTRUCTOR and show My Teaching only for that role. New backend routes enforce actual role even if client buttons are hidden. Add synthetic Instructor fixtures explicitly for local/test and a reviewed demo provision procedure; never auto-provision at startup or replace existing passwords. No self-registration or account admin scope is added.

Build/runtime stack, cookie policy, password hashing, current session expiry and main-only deployment pipeline are unchanged. Migrations and provisioning are separate operator steps. Configuration adds no client secrets or proposed public test-clock controls. Actual commands/output and checked versions belong to feature evidence; none have run for Sprint2.
