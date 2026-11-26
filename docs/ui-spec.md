# RegMeUp — UI Specification: Sprint 1

| Item | Value |
|---|---|
| Version | 1.0 — English translation |
| Date | 6 November 2026 |
| Status | Design and implementation baseline; pending team review and recorded acceptance |
| Recommended repository location | `docs/ui-spec.md` |
| Features | F-01, F-02, F-03, F-04 |
| Referenced decisions | DEC-05, DEC-06, DEC-07 |
| Source document | `project-cpe334-sprint-1 (1).pdf` |

This document defines Sprint 1 screens, navigation, permissions reflected in the UI, validation, and interaction outcomes based on the latest SRS decisions. Proposed routes, layouts, copy, and additional interaction behavior form a design baseline for team review. This document does not constitute evidence of implementation, testing, or approval.

All example interface copy below is presented in English. Translating this specification does not itself establish a new product localization requirement; record the final interface language in the team's design decisions.

## 1. Scope and Principles

### 1.1 Included

- Public discovery: unauthenticated visitors can browse published events and view their details.
- Login, logout, and current-user identity.
- Organizers can publish events and view registrations for their own events.
- Participants can register on their own behalf and retrieve their own registrations.
- Rejection states for full events, duplicate registrations, forbidden roles, and ownership violations.
- Relevant loading, empty, validation, error, and success states.
- Desktop and mobile layouts, including keyboard operation.

### 1.2 Excluded

Instructor assignment and teaching pages, self-registration, password recovery, email verification, account administration, cancellation, registration deadlines, event editing/deletion, capacity changes, check-in, QR tickets, attendance reports, waitlists, payments, exports, and external notifications are outside Sprint 1. Do not display nonfunctional controls for these features.

### 1.3 Authoritative Rules

- **DEC-05:** Event name, start date/time, end date/time, location, and capacity are required. Description is optional. End time must be after start time. Capacity must be an integer greater than zero.
- **DEC-06:** Published Event List and Event Detail screens are public. Registration requires authentication.
- **DEC-07:** Only Participant accounts may register. Organizer requests must be rejected even when submitted directly to the API.
- The backend determines identity, role, ownership, seat availability, and the actual registration outcome. Hiding or disabling a control is not authorization.
- Do not use a client-selected `participantId`, `organizerId`, or role to establish record ownership. The server derives ownership from authenticated identity.
- Disabling repeated clicks does not replace database protection against concurrent requests.

## 2. Screen Inventory and Routes

The following are proposed frontend routes, not API endpoint definitions.

| Screen ID | Screen | Route | Access | Feature | Existing AC |
|---|---|---|---|---|---|
| UI-01 | Login | `/login` | Public | F-01 | AC-01, AC-02 |
| UI-02 | Event List | `/events` | Public and authenticated users | F-02 | AC-09; add FR-03 coverage |
| UI-03 | Event Detail | `/events/:eventId` | Public and authenticated users | F-02, F-03 | AC-04–AC-07, AC-09 |
| UI-04 | My Registrations | `/my-registrations` | Participant | F-03 | AC-04, AC-09, AC-10 |
| UI-04-D | Registration Detail modal | Within UI-04 | Participant who owns the registration | F-03 | AC-04, AC-09, AC-10 |
| UI-05 | Organizer Events | `/organizer/events` | Organizer | F-02, F-04 | AC-08, AC-09 |
| UI-06 | Create Event | `/organizer/events/new` | Organizer | F-02 | AC-03, AC-09 |
| UI-07 | Event Registrations | `/organizer/events/:eventId/registrations` | Organizer who owns the event | F-04 | AC-08, AC-09 |
| UI-S01 | Access Denied | Shared state | Based on authorization result | F-01–F-04 | AC-08, AC-09 |
| UI-S02 | Not Found | Shared state | All users | F-02–F-04 | Add UI verification |

Redirect `/` to `/events` for every role. Ensure fixed routes such as `/organizer/events/new` are not interpreted as event IDs.

## 3. Navigation and Access

| User | Main navigation | User controls | Default destination after login |
|---|---|---|---|
| Anonymous | Logo → `/events`, Events | Log in | Not applicable |
| Participant | Events, My Registrations | User name, role, Log out | `/events` |
| Organizer | Events, My Events | User name, role, Log out | `/organizer/events` |

- Retrieve current-user identity from the server. Do not provide a role selector that changes permissions.
- While checking the session, show placeholders in user controls. Do not render private content before access is established.
- The mobile menu button must have an accessible name, expose its expanded state, and support Escape to close.
- Anonymous access to a protected route redirects to Login with an internal return path.
- An authenticated user with the wrong role sees UI-S01, rather than being redirected repeatedly to Login.
- Ownership denial must not reveal the denied resource's name, registration list, or private details.
- Handle missing or forbidden resources according to the backend's safe error policy. Do not fetch additional data to expose a denied resource.

### 3.1 Login Return Flow

1. An anonymous visitor opens Event Detail and selects **Log in to register**.
2. Navigate to `/login?returnTo=/events/:eventId`.
3. After successful login, return to the same event and reload identity and current state.
4. The Participant must explicitly select Register again. Do not submit a registration automatically after login.
5. If the account is an Organizer, return to the event with role-appropriate controls and no enabled registration action.

Accept only allowlisted internal return paths accessible to the current role. Never redirect to an external URL supplied through `returnTo`. If the value is invalid, use the role's default destination.

### 3.2 Logout and Session Expiry

- Follow the system's session/token design. After successful logout, clear private client caches and navigate to `/events` as Anonymous.
- Show progress and prevent repeated logout requests. On failure, report the error instead of claiming logout succeeded.
- If the session expires during a protected action, stop the action, clear displayed private data, and show: **Your session has expired. Please log in again.**
- On public Event Detail, retain public event information and update controls to the Anonymous state.
- Browser Back after logout must not reveal cached private content without rechecking access.
- Define token storage, expiry, and invalidation in the System SDS/API contract consistently with this behavior.

## 4. Visual System

| Token | Value / Usage |
|---|---|
| Brand orange | `#F97316` for accents, graphics, and branding |
| Primary button | `#C2410C` with white text; hover `#9A3412` |
| Main text / dark areas | `#171717` |
| Page background | `#F7F7F5` |
| Card background | `#FFFFFF` |
| Border | `#E5E7EB`; input boundaries and focus indicators must be stronger than decorative borders |
| Font | Noto Sans Thai with a sans-serif fallback |
| Spacing | Multiples of 8px; 4px for small adjustments |
| Corner radius | Cards: 16px; inputs/buttons: 10px |
| Content width | Maximum 1200px; readable form width approximately 720px |
| Icons | Consistent outline style; hide decorative icons from screen readers |

- Use light backgrounds, white cards, near-black navigation/text, and orange action accents.
- Keep headings clear. Avoid oversized hero sections that push event listings far down the page.
- Use prepared cover assets or placeholders. Sprint 1 has no image-upload control.
- Failed images must fall back gracefully without hiding event names.
- Communicate status through text or icons as well as color.
- Use the darker primary-button color for readable white text, rather than small white text directly on brand orange.

### 4.1 Responsive Design and Accessibility

- **Mobile:** below 768px; single column; 16px page padding.
- **Tablet:** 768–1023px; two event-card columns when space permits.
- **Desktop:** 1024px and above; 24–32px page padding; three event-card columns.
- Produce reference layouts at 1440px and 390px, while supporting widths down to 320px without page-level horizontal scrolling.
- Convert registration tables to cards on mobile, preserving essential information.
- Recommended interactive target size is at least 44×44px, with visible keyboard focus.
- Every input requires a real label. Associate required/error information semantically; placeholders must not replace labels.
- Announce asynchronous outcomes through appropriate live regions. Do not move focus unexpectedly.
- After failed form submission, focus the first invalid field and associate its error text.
- Modals require a name, focus trapping, Escape/close support, and focus restoration to the trigger.
- Use one main page heading. Support zoom and long event/location names without permanently hiding essential information.

## 5. Detailed Screen Specifications

### UI-01 — Login

**Layout:** On desktop, place a dark branding panel with an orange ticket illustration on the left and a white login form on the right. Use one column on mobile. Provide a way to browse events without logging in.

**Fields and actions:** Email, password, show/hide password, **Log in**, and **Browse events**. Do not include sign-up or password-recovery actions.

**Validation and behavior:**

- Email and password are required. Trim email whitespace, but do not trim or modify passwords.
- Validate email format on the frontend and handle server validation as well.
- Show/hide password must not submit the form. Support password managers and paste.
- Pending: show **Logging in…** and prevent repeated submission.
- Invalid credentials: **Incorrect email or password.** Do not reveal whether an account exists.
- Network/server error: **Unable to log in. Please try again.** Preserve the email and never log the password.
- Success: retrieve current-user identity and apply the return flow or role default.
- An authenticated user opening `/login` navigates to a safe return path or their default destination.

### UI-02 — Event List

**Layout:** Public navigation, heading **Discover events and workshops**, and an event grid. Search/filter functionality requiring additional implementation is outside this baseline.

**Card data:** Cover image, event name, start/end date and time, location, remaining seats, availability status, and **View details**. Do not show registrant information.

- Retrieve only published events. Full events remain viewable.
- Event names and detail actions link to UI-03 using semantic links.
- Show **Seats available** or **Full** based on server data. Do not imply deadline-based registration status when deadlines are outside Sprint 1.
- Loading: skeletons preserve card space.
- Empty: **No events are available yet.**
- Error: **Unable to load events.** Include **Try again**; never represent an error as an empty list.
- Ordering and pagination must match the list API contract. Do not add unsupported controls.

### UI-03 — Event Detail

**Layout:** Breadcrumb → cover image → two desktop columns: approximately two-thirds event details and one-third registration card. Stack on mobile.

**Public data:** Event name, start/end date and time, location, capacity, remaining seats, optional description, and organizer display name if supplied in the public response. Do not infer or expose organizer email or other private information.

**Optional description:** Hide the description section when empty; do not leave an empty heading.

#### Registration States

Resolve identity first, then combine the Participant's registration state with availability. **Already registered takes precedence over Full.**

| Condition | UI / CTA | Action |
|---|---|---|
| Anonymous; seats available | **Log in to register** | Login with `returnTo` |
| Anonymous; event full | Disabled **Full**; navbar login remains available | No registration request |
| Participant; own-registration state loading | Placeholder or temporarily disabled action | Wait before deciding state |
| Participant; not registered; seats available | **Register for event** | Submit using current authenticated identity |
| Registration request pending | Disabled **Registering…** | Prevent repeated requests |
| Participant; already registered, including a full event | **Already registered**, with **View my registration** | Open the matching registration in UI-04 |
| Participant; not registered; event full | Disabled **Full** | No request |
| Organizer | **Registration is available to Participant accounts.** | No enabled registration CTA |

- If own-registration status cannot load, show retry and keep registration disabled until the state is known.
- Success: show **Registration successful**, the server-provided reference if available, and a registration-detail link. Refresh remaining seats and registration state from the server.
- Full conflict: **This event is full. Registration could not be completed.** Refresh availability.
- Duplicate conflict: **You are already registered for this event.** Retrieve the existing registration and provide its detail link. Never generate a reference on the client.
- Forbidden: show the appropriate access message without private data.
- Network timeout or unknown outcome: **We could not confirm your registration. Please check My Registrations.** Provide a check action before offering a retry; do not assert definite failure.
- Do not create optimistic success, registrations, or references before server confirmation.
- Reloading must retrieve the actual state rather than relying only on local state.
- Unknown/unpublished event: display a safe Not Found state without unpublished information.

### UI-04 — My Registrations and UI-04-D

**Layout:** Heading **My Registrations**. Horizontal cards on desktop; vertical cards on mobile.

**List data:** Event name, date/time, location, registration status, registration timestamp, server-issued reference or registration ID, and **View registration**.

**Detail modal:** Current registrant name, reference, essential event details, registration timestamp, status, and Event Detail link. No QR code or cancellation button.

- Retrieve records using authenticated identity; provide no user-ID selector.
- Proposed deep link: `/my-registrations?registrationId=:id`, opening the specified modal only after authorization is established.
- If the list response lacks necessary detail, request an authorized detail response before displaying it.
- Changing a query parameter or ID must never reveal another user's registration. The server always checks ownership.
- Loading: skeletons.
- Empty: **You have not registered for any events yet.** Include **Browse events**.
- Error: show retrieval failure and retry, rather than an empty list.
- Existing registrations must remain retrievable from the database after reload or application restart.
- Do not display cancellation/attendance states that have not been implemented.

### UI-05 — Organizer Events

**Layout:** Heading **My Events**, primary **Create event** action, desktop table/mobile cards.

**Data:** Event name, date/time, location, active registration count / capacity, remaining seats, and **Seats available** / **Full** status.

**Actions:** **Create event** → UI-06; **View details** → UI-03; **View registrations** → UI-07.

- Show only the authenticated Organizer's events from authorized responses. Client filtering of all events does not replace authorization.
- Registration counts include only active records according to the domain model.
- Loading: skeletons.
- Empty: **Create your first event.** Include the create action.
- Error: show a retrieval message and retry.
- No editing/deletion, instructor assignment, check-in, reports, exports, or charts in Sprint 1.

### UI-06 — Create Event

**Layout:** Breadcrumb → **Create event** heading → form card. On desktop, date/time fields may share a row when readable. Stack fields on mobile.

| Field | Required | Validation | Example error |
|---|---|---|---|
| Event name | Yes | Must contain text after trimming | **Enter an event name.** |
| Start date and time | Yes | Valid date/time | **Enter a valid start date and time.** |
| End date and time | Yes | Valid and later than start | **End time must be after start time.** |
| Location | Yes | Must contain text after trimming | **Enter a location.** |
| Capacity | Yes | Integer greater than zero | **Capacity must be a positive whole number.** |
| Description | No | May be empty; display as plain text | No required-field error |

- Clearly mark required fields and label description **Description (optional)**.
- Reject zero, negative values, fractions, and nonnumeric capacity values; the server validates again.
- Do not invent future-start restrictions, maximum capacity, or minimum duration without an SRS/contract decision.
- Maximum field lengths must match the schema/API contract; do not invent unapproved limits.
- Do not include deadline, Instructor picker, upload, draft/save-draft, or editing controls.
- Use a prepared/default cover image; no required image field.
- **Cancel** returns to UI-05 without creating a record. If the form has unsaved changes, ask before discarding it.
- **Publish event** validates and submits the form. Prevent repeated submission while pending.
- Show field errors under their fields and form-level errors above actions. Focus the first invalid field.
- Display safe server validation errors and preserve entered data. Never expose stack traces or raw database errors.
- Success: wait for server confirmation, show **Event published successfully**, and navigate to the new event's UI-03.
- Unknown network outcome: preserve the form and ask the user to check **My Events** before resubmitting. Disabling the button does not guarantee duplicate publication cannot occur.

### UI-07 — Event Registrations

**Layout:** Breadcrumb → event name, date/time, location → registration/capacity/remaining-seat summary → table or cards.

**Columns:** Row number, registrant name, registration reference, registration timestamp, and status. Do not display phone numbers, email addresses, or other personal information without a corresponding requirement.

- Confirm event ownership before showing either metadata or registrations.
- Loading: skeletons.
- Empty: **No participants have registered for this event yet.**
- Error: retry. Forbidden/not found: safe shared state, without cached details from a previously viewed event.
- No check-in, cancellation controls, or export.
- Ordering/pagination must match the API. If paginated, summary totals come from the server rather than the current page's row count.

## 6. Shared Data and Error Behavior

### 6.1 Dates, Times, and Numbers

- Clearly identify the timezone used for reading and entering event times.
- Proposed baseline for a Thai university: display and accept `Asia/Bangkok` time with **Thailand time (UTC+7)**, with explicit timezone handling in API conversion and responses.
- This is a proposed event-time UI decision, not confirmation of Sprint 2 deadline rules. Align it with the System SDS/API before implementation.
- Show complete start and end dates/times, especially for events spanning multiple days.
- Remaining seats come from the server. Do not display negative availability; inconsistent data should produce an unavailable/retry state instead of enabling registration.
- Public event responses must not include registrant lists or private registration objects.

### 6.2 Semantic Error Mapping

These are UI error categories, not confirmed backend error codes or HTTP status assignments. The API contract defines the actual mapping.

| Category | UI response |
|---|---|
| Validation | Field/form errors; preserve input |
| Unauthenticated / expired | Login flow or session-expiry message |
| Forbidden role | Access Denied without private data |
| Forbidden ownership | Safe denial/not found according to backend policy |
| Full | Explain full state and refresh availability |
| Duplicate registration | Retrieve and link to existing registration |
| Not found / unpublished | Not Found with a return-to-events action |
| Network / server error | General message and appropriate retry |
| Mutation outcome unknown | Check server state before offering resubmission |

- Loading, empty, and error are distinct states. Never show “no data” for a failed request.
- A toast must not be the only presentation of an important error. Keep an inline message in context.
- Retrying a read must not automatically trigger a mutation.
- Display safe response details only; never expose tokens, passwords, SQL, or stack traces.

## 7. UI Data Dependencies

This section identifies UI data needs. Feature/API contracts define actual field names and endpoints.

| Screen | Required data / operations |
|---|---|
| Shared navigation | Current identity/role; login/logout |
| UI-02 | Public published-event list; capacity/remaining seats |
| UI-03 | Public event detail; Participant's own registration status; registration creation |
| UI-04 | Own-registration list and authorized detail |
| UI-05 | Own-event list with active registration counts |
| UI-06 | Event publication; field validation errors; created event ID |
| UI-07 | Owner-authorized event metadata, registrations, and totals |

Public responses, own-registration responses, and Organizer-private responses must maintain appropriate data boundaries regardless of endpoint structure.

## 8. User Journeys

### 8.1 Public Visitor to Participant Registration

`/events` → Event Detail → Login with `returnTo` → Event Detail → explicit registration → success → My Registrations/detail.

### 8.2 Organizer Publication

Login → Organizer Events → Create Event → validation → publish success → Event Detail → Organizer Events → Event Registrations.

### 8.3 Persisted Retrieval

Successful Participant registration → reload or revisit → My Registrations → open the existing registration. Persistence verification must also include retrieval after an application restart.

## 9. Planned UI Verification and Traceability

`UIV-*` IDs are proposed verification items, not test results. They do not replace TEST-01–TEST-10 in the STS. Link them to actual test IDs before implementation.

| ID | Scenario | Expected outcome | Links |
|---|---|---|---|
| UIV-01 | Anonymous opens list/detail | Published events visible; no private data | FR-03, DEC-06, AC-09 |
| UIV-02 | Anonymous selects registration, then logs in as Participant | Return to the same event; no automatic registration | FR-01, FR-04, AC-01, AC-04 |
| UIV-03 | Valid/invalid login and logout | Correct identity, messages, and navigation | AC-01, AC-02 |
| UIV-04 | Organizer opens Event Detail | No enabled registration action; verify API restriction separately | DEC-07, AC-09 |
| UIV-05 | Publish valid event with empty description | Publish and retrieve successfully | DEC-05, AC-03 |
| UIV-06 | Missing required fields, invalid capacity, invalid time range | Field errors; no publication | DEC-05, AC-03 |
| UIV-07 | Register and retrieve registration | Success and displayed data match server records | AC-04 |
| UIV-08 | Full event before/during registration | Accurate full state; no false success | AC-05, AC-07 |
| UIV-09 | Duplicate/already registered when event is full | Existing registration takes precedence over Full | AC-06 |
| UIV-10 | Protected route with wrong role/owner | Denial without private-content flash | AC-08, AC-09 |
| UIV-11 | Retrieve after reload/restart | Existing registration remains retrievable | AC-10 |
| UIV-12 | List loading/empty/error | Distinct states and working retry | NFR-06 |
| UIV-13 | Network timeout during registration | No definite-failure claim; offer registration check | F-03, NFR-06 |
| UIV-14 | Keyboard/mobile/modal operation | Usable navigation, focus, and content | NFR-06 |

Select critical E2E coverage for at least Participant registration/retrieval and Organizer publication/registration-list journeys, with suitable negative cases. Concurrency, API authorization, and persistence also require actual API/database tests according to the STS. Screenshots or UI tests alone do not prove those rules.

Verification status for every row: **PLANNED / NOT RUN**.

## 10. Implementation Handoff and Baseline Acceptance

Before implementing each feature:

- [ ] Review the relevant UI with the teammate and record the review in an Issue/PR.
- [ ] Link Screen IDs to feature contracts, FR/BR/NFR, AC, and STS.
- [ ] Confirm field names, limits, response shapes, and semantic error mappings in API/data contracts.
- [ ] Confirm event timezone and date/time presentation across the UI and API.
- [ ] Define the session/token lifecycle in the System SDS consistently with login/logout/expiry behavior.
- [ ] Confirm list ordering/pagination supported by the API.
- [ ] Add FR-03 and UI-state coverage to traceability without claiming tests have passed.
- [ ] Commit specification/test design before the corresponding implementation, retaining reasons for contract revisions.

Sprint 1 may begin before Instructor, deadline, cancellation, and attendance designs are complete. Do not introduce later-sprint rules into the UI without recording a scope change.

### Revision History

| Version | Date | Change | Review |
|---|---|---|---|
| 1.0 | 2026-11-06 | Defined seven main screens, public discovery under DEC-06, Participant-only registration under DEC-07, DEC-05 form validation, shared states, and planned verification | Pending team review |
| 1.0 — English translation | 2026-11-06 | Translated the baseline into English, retaining screen/requirement IDs, behavior, scope, and pending decisions; example interface copy is also translated | Pending team review |

A review entry is not evidence of approval until an actual reviewer and corresponding Issue/PR are recorded.

## Sprint 2 extension — confirmed policy

Version1.2 — 26 November2026. Refs #40–#43/#51. Extends the Sprint1 screens above; **policy CONFIRMED, implementation NOT STARTED / verification NOT RUN**. [Review and ownership](sprints/sprint-2/review-record.md): Kittithat F-05/F-06, Thanatip F-09, cross-review. COMMENTED policy review is not formal PR approval; follow-up approval/merge pending. Policy/API/data sources: [decisions](sprints/sprint-2/decisions.md), [shared design](sprints/sprint-2/system-design.md). Do not infer new permissions from visibility of UI controls.

| Screen / route | Workflow and states | Verification |
|---|---|---|
| UI-04/04-D own registrations | ACTIVE/CANCELLED history keyed by registrationId; Cancel confirmation before start, pending disabled, server-confirmed status/cancelledAt, cancelled detail retained, reload own state on unknown outcome | S2-T05-07 + API/DB S2-T05-01–06 |
| UI-05 My Events / owner detail | Add Edit event and Manage Instructor links for own events; keep active registrants/summary separate from cancellation history | S2-T06-08/S2-T09-08 + owner denial tests |
| UI-S2-01 /organizer/events/:id/edit | Load private owner edit DTO; partial edit fields and optional deadline; show Bangkok timezone and cutoff semantics; field errors/first-invalid focus, dirty-form confirmation, pending, unknown outcome and stale-edit reload/review | S2-T06-01/05/08 |
| UI-03 public event detail | Show effective registration cutoff; Closed at cutoff, full/duplicate states remain meaningful; backend response controls actual registration; preserve public privacy | S2-T06-02/08 + original UI tests |
| UI-S2-02 owner Instructor management | Paginated id/displayName directory, current assignment, assign/replace/remove confirmation; empty/error/retry/version conflict/overlap rejection without disclosing other events | S2-T09-01–04/08 |
| UI-S2-03 /my-teaching and /my-teaching/:id | INSTRUCTOR-only navigation, paginated current teaching list/detail; empty differs from failed read; removed/unassigned404; no registrant or management actions | S2-T09-05/06/08 |

All new private routes authorize before displaying cached data and clear on logout/401/role changes. Add role-safe local returnTo allowlist entries, never external URLs. Use visible labels/focus, live status/error announcements, modal focus trap/Escape/restore and keyboard operation. Verify1440/390 and320px without page horizontal overflow. Server messages use safe contract errors; no implementation constants/version numbers need to be shown to end users.

Separate Edit Event component from Create Event where practical to reduce concurrent Lab7 edits. Do not modify create1–60 behavior here: Lab7 owns its validation/copy/tests. In legacy edit, send capacity only when explicitly changed. API and database checks remain mandatory when UI is bypassed.
