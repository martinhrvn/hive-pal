# Smoke suite TODO

Tick a line when its spec passes against a preview. See [README.md](./README.md)
for conventions. One spec file per line; each file signs up its own user.

## Tier 0 `@journey`

- [x] `journey.spec.ts` — sign up (UI) → delete auto apiary → onboarding wizard → inspection → second apiary → second hive → switcher → log out / in. owner: foundation Note: the wizard redirects to `/` as soon as the user has an apiary and a hive, so the "Congratulations!" step may never show; the spec accepts either. The hive form requires an installation date (HiveFormPage picks today when empty).

## Tier 1 `@core` (one happy path per page)

- [x] `core/dashboard.spec.ts` — seed hive; `/` shows "My Apiary" and the hive, click → `/hives/:id`. Second test without seed: "No hives yet" → "Add your first hive" → `/hives/create`.
  - Hive entries on the dashboard are cards without a link role: `DashboardPage.hive(name)` uses `getByText(name, { exact: true })`. The empty-state action is a real `<a>` ("Add your first hive").
- [x] `core/apiaries.spec.ts` — `/apiaries` → "My Apiary" detail (tabs) → "Edit Apiary" → rename → submit → switcher shows new name. Location tab is a Leaflet map: do not interact.
  - Rows are matched via `getByRole('row', { name })`; "Details" is a button inside the row. Tabs: Overview / Hives / Location (+ Sharing for owners). Edit redirects to `/apiaries/:id`.
- [x] `core/hives.spec.ts` — seed hive; `/hives` → detail → "Edit Hive" → change "Label" → save → heading updated; "Boxes" tab renders.
  - `/hives` rows: the hive name is a stretched link covering the whole `<tr>`; `HiveListPage.openDetails` clicks that link. Edit redirects to `/hives/:id`. Neither page reads inspections, so the local missing-migration 500 does not affect it.
- [x] `core/inspections.spec.ts` — seed hive + COMPLETED inspection; `/inspections` lists it → View → detail → Edit → change notes → save → shown. Second test: `/inspections/create` → pick hive → save → `/inspections/:id`. Do not assert photo/audio sections (`storageEnabled`). Note: the hive select trigger has no accessible name; InspectionFormPage matches it by its "Select a hive" text. Detail page h1 is the hive name; the primary submit has `data-testid="inspection-save"`.
- [x] `core/inspection-schedule.spec.ts` — seed hive; `/inspections/schedule` → tick hive → day "Today" → "Schedule 1 Inspection" → `/inspections/list/upcoming` lists it. Apiary has no coordinates: confirm the day grid renders without weather. Note: hives are ticked via their `<label>` (checkbox has no name); Upcoming renders cards under "Today's Inspections (N)", not table rows. Submit label is "Schedule 1 Inspection".
- [x] `core/queens.spec.ts` — seed hive; hive detail → "Add Queen" → year → "Create Queen" → back on hive, "Queen History" shows year; `/queens` lists it.
  - Note: the Year input is a number field (`getByRole('spinbutton', { name: 'Year' })`), prefilled with the current year. A queen without name/marking is shown as a `Queen <year>` link in both tables; `/queens` also has a "Hive" column, so assert on the row containing `Queen <year>` plus the hive name.
- [x] `core/todos.spec.ts` — `/todos` quick add → visible → toggle complete → hidden → "Show completed" → visible. Note: the quick-add "Add" button needs `exact: true` (sidebar has "Bulk Add"); the list toggle is `checkbox` "Toggle complete", the filter is `switch` "Show completed".
- [x] `core/calendar.spec.ts` — seed SCHEDULED inspection tomorrow noon; `/calendar` → "Today" → hive name visible in the week view. Note: events are rendered with the hive name via `getHiveName`; "Today" is an exact-name button.
- [x] `core/settings.spec.ts` — `/settings` → Theme → "Dark" → "Save Settings" → success toast. Note: Theme select is `combobox` "Theme" (label `for`); toast text is "Changes saved successfully"; save goes to `PUT /api/users/preferences`.
- [x] `core/feedback.spec.ts` — `/feedback` → type, subject, message → "Submit Feedback" → "Thank You!". Note: card title "Send Feedback" is a plain div that collides with the sidebar button of the same name; the page object anchors on the "Feedback Type" label instead.
- [x] `core/files.spec.ts` — `/files` empty state renders; filter "Photos" clickable. No upload (storage-gated). Note: "Photos" is an option of an unlabelled Select (not a tab); the page object finds the combobox by its current text ("All Files" → "Photos"). Heading is an h3 "Files".
- [x] `core/reports.spec.ts` — seed hive + inspection; `/reports` → tab "Charts" renders. Note: "Hive Score Trends" lives in the Trends tab; Charts has honey/feeding charts. In view-all mode the page shows "Select an apiary to view reports".
- [x] `core/auth.spec.ts` — no fixture. Register without consent → validation error; login with wrong password → "Invalid email or password"; `/forgot-password` → "Send Reset Link" → "Reset Link Sent". `retries: 0` (reset endpoint limited to 3/60 s per IP).
  - Note: the consent error ("Privacy policy consent is required") is client-side, but email/password/confirm have HTML `required`, so fill every other field first. Forgot-password answers OK for unknown emails (no enumeration), so no real account is needed; the email label is "Email address".

## Tier 2 `@extended`

- [x] `extended/harvests.spec.ts` — seed hive; `/harvests` → "Start Harvest" wizard → detail. Labels are hard-coded English. No share button assertions.
- [ ] `extended/batch-inspections.spec.ts` — seed 2 hives; schedule page → tick both → "Create as Batch Inspection" → name → `/batch-inspections/:id`; list shows it.
- [ ] `extended/bulk-add.spec.ts` — seed 2 hives; `/actions/bulk` → select all → Actions tab → add Feeding → submit queue → toast. Labels under `common.json` `bulkAdd.*`.
- [ ] `extended/equipment.spec.ts` — seed hive; `/equipment` → change "Target Hives" → "Save All Changes" → toast.
- [ ] `extended/qr-print.spec.ts` — seed hive; `/hives/qr-codes/print` → select hive → print button; stub `window.print` with `addInitScript`.
- [ ] `extended/mobile-inspection.spec.ts` — `test.use({ ...devices['Pixel 5'] })`; seed hive; `/hives/:id/inspect/mobile` → steps → save → `/inspections/:id`. Needs `data-testid` on wizard next/save controls.
- [ ] `extended/hive-actions-dialog.spec.ts` — seed hive; hive detail → add action dialog → Feeding → save → timeline shows "Feeding".
- [ ] `extended/data-transfer.spec.ts` — `/settings/data-transfer` → "Start export" → job row → poll `GET /api/account-transfer/jobs` until done. `test.skip` when `storageEnabled` is false.
- [ ] `extended/public-pages.spec.ts` — no fixture. `/tools`, `/tools/syrup-calculator`, `/da/tools/syrup-calculator`, `/features`, `/releases`, `/privacy-policy` → h1 visible; `/xx/tools` and `/no-such-route` → not found; logged-out `/` → landing.

## Tier 3 `@collab` / `@admin`

- [ ] `collab/sharing.spec.ts` — `freshUser` (owner, rename apiary to a unique name, seed hive) + `secondUser`. Owner: `/apiaries/:id?tab=sharing` → "Create Link" → "View only"; token via `GET /api/apiaries/:id/invites`. Second context: `/join/:token` → "Request to Join" → "Request sent!". Owner approves. Viewer sees the hive on `/hives`; `/hives/create` redirects to `/hives`.
- [ ] `admin/admin-users.spec.ts` — `test.skip` without `ADMIN_EMAIL`/`ADMIN_PASSWORD`; API sign-in → `/admin/users` → "User Management" visible. Read-only.

## Follow-ups (not specs)

- [ ] App: `EditableRoute` evaluates `canEdit` as soon as apiaries load, before `useApiary` auto-selects the first apiary, so a user with no stored selection can be redirected off `/inspections/schedule` and similar routes. The `freshUser` fixture pre-seeds `hive_pal_apiary_selection` to avoid it; the guard should wait for the active apiary instead.
- [ ] App: the onboarding wizard redirects to `/` once the user has an apiary and a hive, which pre-empts its own "Congratulations!" step.
- [ ] Dev: Vite proxied every path starting with `/api` (including `/apiaries/*`) to the backend; fixed on this branch by anchoring the proxy key to `^/api/`.

- [ ] Expose the deployed commit (`GIT_SHA`) in `/env.js` so CI can verify the preview matches the PR head before running.
- [ ] Backend opt-out `rateLimit: { enabled: false }` behind `E2E_DISABLE_RATE_LIMIT=true` for preview stacks, if 429 retries make runs slow.
- [ ] Periodic cleanup of `smoke+%@e2e.hivepal.test` users on the long-lived preview DB.
