# Hive Pal — Pull Request Changelog

## Summary

This PR delivers five feature areas: apiary membership management, onboarding improvements, activity performer tracking, dashboard navigation refinements, and VIEWER role enforcement.

---

## Features

### Apiary Membership Management
- **Invite members to an apiary** — owners can invite registered users by email from the new Members tab on the Apiary Details page. Invitations are sent as templated emails with an accept link.
- **Role-based access** — invited members can be assigned `VIEWER` or `EDITOR` roles. Roles can be changed or members removed by the owner at any time.
- **Email privacy** — only the apiary owner can see members' email addresses; editors and viewers see names only.
- **Accept invitation page** — a public route (`/invitations/accept/:token`) allows users to accept membership without being logged in first.

### Onboarding: Join Existing Apiary
- **New onboarding flow** — the user wizard now presents a choice on the welcome step: create a new apiary or request to join an existing one.
- **Join by owner email** — users can enter the email address of an apiary owner to look up their apiaries and submit a join request.
- **Owner approval emails** — the apiary owner receives a templated email with Approve / Deny buttons. Clicking Approve opens a page where the owner selects the role before confirming.
- **Requester notifications** — the requesting user receives an email confirming whether their request was approved or denied.
- **Approval page** (`/join-requests/approve/:token`) — role picker UI before confirming membership.
- **Deny page** (`/join-requests/deny/:token`) — auto-denies on load and shows a confirmation message.

### Activity Performer Tracking
- **Who performed each action** — `Action`, `Inspection`, and `QuickCheck` records now store the `performedById` (the user who created the record). The API includes `performedBy { id, name, email }` in all list and detail responses.
- **Box configuration actions tracked** — hive box changes (`BOX_CONFIGURATION` action type, created automatically when a user edits hive boxes) now correctly record `performedById`. Previously this code path did not capture the performer.
- **Members can create actions** — the ownership check on standalone action creation has been relaxed to allow apiary editors/members to create feeding, treatment, harvest, and other actions (previously only the apiary owner could).
- **Timeline performer display** — the Recent Activity timeline shows `· [performer name]` next to the date/time of each event.
- **User filter on timeline** — when activity from more than one user is present, a "User" dropdown filter appears alongside the existing Event Type, Date Range, and Hive filters. Selecting a user shows only their activity, and it composes with the other filters.
- **Activity visibility for all members** — all accepted members of an apiary (not just the owner) can now see the full activity timeline for that apiary.

### Dashboard & Navigation
- **Hive Layout quick link** — the Hive Layout card on the dashboard now has an "Edit Layout" button that navigates directly to the Hives tab inside Apiary Details (`/apiaries/:id?tab=hives`).
- **Apiary Details link** — an "Apiary Details" link button (with map pin icon) has been added to the Apiary Statistics card header on the dashboard, and to the Statistics card on the Reports page. The link in the Navigate sidebar section has been removed.
- **Apiary Details tab deep-linking** — the Apiary Details page now reads a `?tab=` query parameter so links can open directly to Overview, Hives, Location, or Members tabs.
- **Hive count fix** — the Hive count in the Apiary Information card was hardcoded to `0`; it now correctly reflects the number of hives in the apiary.

---

## VIEWER Role Enforcement

### Backend
- **All write endpoints require `EDITOR` or `OWNER` role** — the following controllers now reject `403 Forbidden` for VIEWER members attempting to create, update, or delete data:
  - `ActionsController` — POST, PUT, DELETE
  - `QueensController` — POST, PATCH, DELETE
  - `AlertsController` — PATCH, POST/dismiss, POST/resolve
  - `InspectionAudioController` — POST (upload), DELETE
  - `HarvestsController` — POST, PUT, PUT/:id/weight, POST/:id/finalize, POST/:id/reopen, DELETE

### Frontend — greyed-out UI for VIEWERs
- **`useApiaryRole` hook** — new hook (`hooks/use-apiary-role.ts`) resolves the current user's apiary role from the members list and exposes a `canEdit` boolean and `isLoading` flag.
- **`EditorRoute` guard** — new route-level component (`routes/editor-route.tsx`) that redirects VIEWER members to `/` when they attempt to access any create or edit URL directly. Wraps the following routes: `/hives/create`, `/hives/:id/edit`, `/hives/:hiveId/inspections/create`, `/inspections/create`, `/inspections/schedule`, `/inspections/:id/edit`, `/queens/create`, `/hives/:hiveId/queens/create`, `/queens/:queenId/edit`, `/batch-inspections/:id/inspect`, `/actions/bulk`.
- **Home dashboard sidebar** — "New Hive", "New Inspection", "Schedule Inspection", and "New Queen" buttons are disabled (greyed out) for VIEWER members.
- **Hive detail sidebar** — "Add Inspection", "Schedule Inspection", "Add Queen", "Edit Hive", and "Remove Hive" are disabled for VIEWERs.
- **Hives list sidebar** — "Create New Hive" is disabled for VIEWERs.
- **Quick Check button** — the Quick Check dialog trigger (in the dashboard timeline header and the apiary sidebar) is disabled for VIEWERs in all locations.
- **Apiary action sidebar** — Quick Check button is disabled for VIEWERs.
- **Harvest list page** — "Start Harvest" button is disabled for VIEWERs; the empty-state wizard button is also disabled.
- **Harvest detail page** — Set Weight, Edit Notes, Edit Hives, Finalize, Reopen, and Delete buttons are all hidden for VIEWERs.

---

## Database Changes

| Migration | Description |
|---|---|
| `20260320000000_add_apiary_join_requests` | Adds `ApiaryJoinRequest` table with `approveToken`, `denyToken`, `status` enum, and relations to `User` and `Apiary`. |
| `20260320010000_add_performed_by` | Adds `performedById` (nullable FK to `User`) on `Action`, `Inspection`, and `QuickCheck` tables. |

> **Note:** Existing `Action`, `Inspection`, and `QuickCheck` records have `performedById = null`. Performer information will be recorded for all new activity going forward.

---

## API Changes

### New endpoints
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/apiary-join-requests/lookup?email=` | Look up apiaries owned by an email address |
| `POST` | `/api/apiary-join-requests` | Submit a join request |
| `GET` | `/api/apiary-join-requests/approve/:token` | Get join request info (for approve page) |
| `POST` | `/api/apiary-join-requests/approve/:token` | Approve request (with role selection) |
| `POST` | `/api/apiary-join-requests/deny/:token` | Deny a join request |
| `GET` | `/api/apiaries/:id/members` | List members of an apiary |
| `POST` | `/api/apiaries/:id/members` | Invite a member |
| `PATCH` | `/api/apiaries/:id/members/:userId` | Change a member's role |
| `DELETE` | `/api/apiaries/:id/members/:userId` | Remove a member |

### Modified responses
- `ActionResponse` — added optional `performedBy: { id, name, email }` field
- `InspectionResponse` — added optional `performedBy: { id, name, email }` field
- `QuickCheckResponse` — added optional `performedBy: { id, name, email }` field

---

## Files Changed

### Backend (`apps/backend`)
- `prisma/schema.prisma` — added `ApiaryJoinRequest` model, `performedById` on `Action`/`Inspection`/`QuickCheck`
- `prisma/migrations/` — two new migration files
- `src/apiary-join-requests/` — new module (service, controller, module)
- `src/actions/actions.service.ts` — removed owner-only visibility filter; relaxed hive ownership check to allow members to create, update, and delete actions; added `performedById` on create; includes `performedBy` in responses
- `src/calendar/calendar.service.ts` — removed owner-only `userId` filter from calendar events query; all apiary members can now see inspections and actions in the calendar card
- `src/hives/hive.service.ts` — `BOX_CONFIGURATION` action creation now records `performedById` from the request user
- `src/inspections/inspections.service.ts` — added `performedById` on create; includes `performedBy` in responses
- `src/quick-checks/quick-checks.service.ts` — added `performedById` on create; includes `performedBy` in responses
- `src/mail/mail.service.ts` — added `sendJoinRequestOwnerEmail()`, `sendJoinRequestResultEmail()`
- `src/mail/templates/` — two new email templates (join request owner, join request result)
- `src/app.module.ts` — registered `ApiaryJoinRequestsModule`

### Shared Schemas (`packages/shared-schemas`)
- `src/actions/action.schema.ts` — added `performedBy` to `actionResponseSchema`
- `src/inspections/inspection.schema.ts` — added `performedBy` to inspection response schema
- `src/quick-checks/quick-check.schema.ts` — added `performedBy` to quick check response schema

### Frontend (`apps/frontend`)
- `src/pages/onboarding/user-wizard-page.tsx` — full rewrite with create/join flow
- `src/pages/apiaries/apiary-detail-page.tsx` — added Members tab, hive count fix, `?tab=` deep-link support
- `src/pages/apiaries/components/apiary-members-tab.tsx` — new component; email privacy (owner-only)
- `src/pages/join-requests/approve-join-request-page.tsx` — new public page
- `src/pages/join-requests/deny-join-request-page.tsx` — new public page
- `src/components/common/timeline-event-list.tsx` — performer display; user filter dropdown
- `src/components/hive-minimap/hive-minimap.tsx` — added "Edit Layout" link to hive tab
- `src/components/home-action-sidebar.tsx` — removed "Apiary Details" nav link
- `src/components/reports-summary-widget.tsx` — added "Apiary Details" link to card header
- `src/pages/reports/components/statistics-cards.tsx` — added "Apiary Details" link; `apiaryId` prop
- `src/pages/reports/reports-page.tsx` — passes `activeApiaryId` to `StatisticsCards`
- `src/api/hooks/useJoinRequests.ts` — new React Query hooks
- `src/routes/index.tsx` — added join-request and invite-accept routes
- `public/locales/en/onboarding.json` — added join flow i18n keys
