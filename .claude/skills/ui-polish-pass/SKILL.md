---
name: ui-polish-pass
description:
  Polish + React-hygiene pass over one Hive Pal frontend page and its component
  tree (no redesign). Audits with taste-skill (polish rules only),
  composition-patterns and react-best-practices, then applies theme tokens,
  shared primitives, perf/bug fixes, composition cleanups and i18n. Use when
  asked to "polish", "clean up", "tidy" or "go down the tree" of a page such as
  the dashboard, hive detail, inspections or apiary pages.
---

# UI polish pass (Hive Pal frontend)

Repeatable version of the dashboard pass (commit `28ba0e2b`). Goal: the page
looks consistent and finished, and its component tree is fast and idiomatic,
**without** a visual redesign or rewrite.

## 0. Scope first

1. Identify the page entry (`apps/frontend/src/pages/...`) and walk every
   component it renders, down to leaves. Skip `components/ui/*` (shadcn
   registry files — don't customize them).
2. Read the companion skills' rule lists: `/composition-patterns`,
   `/react-best-practices`. From taste-skill use **only** the general polish
   rules (it is not meant for dashboards): one accent, one radius scale,
   skeletons, empty states with a CTA, focus/active states, uniform icon sizes.
3. Run the audit (an Explore/Plan agent per subtree works well) and group
   findings into: tokens/visual, shared primitives, perf + real bugs,
   composition, timeline-like big components, i18n.
4. Ask the user which groups are in scope (AskUserQuestion, multiSelect), then
   write a plan and get it approved before editing.

## 1. Theme tokens — reuse, don't invent

Tokens already exist in `src/index.css` (`:root`, `.dark`, `@theme inline`):

| Token | Use for |
|---|---|
| `honey`, `honey-foreground`, `honey-muted` | the single brand accent (icon circles, highlights, active nav) |
| `success` / `warning` / `info` (+ `-foreground`, `-muted`) | status pills, metric tones |
| `destructive` | danger |
| `foreground`, `muted-foreground`, `muted`, `border`, `card`, `accent` | everything neutral |

Swap pattern: `stone-*`/`gray-*` → neutral tokens, `amber-*` → `honey*`,
`sky`/`blue` → `info`, `emerald`/`green` → `success`, `red` → `destructive`.
Any hardcoded palette colour with a `dark:` twin is a smell — the token handles
both modes. Only add a new token if nothing above fits, and add it to all three
blocks. CSS isn't in the prettier script: don't run prettier on `index.css`.

## 2. Shared primitives — use these before writing new markup

- `components/common/status-pill.tsx` — `StatusPill` (`tone`: neutral/success/
  warning/danger/info, `size`, `asChild` for button/Link with hover+press).
- `components/common/metric.tsx` — `Metric` (label/value/unit, `tone`,
  `size: md|lg`, `icon`, `adornment`).
- `utils/status-colors.ts` — single hive-status map: `getStatusTone`,
  `STATUS_DOT_CLASS`, `STATUS_TEXT_CLASS`, `hiveStatusLabelKey`.
- `components/dashboard/dashboard-section.tsx` — `DashboardSection`
  (collapsible `h2` section with `action` slot, persisted by `storageKey`).
- `components/dashboard/empty-state.tsx` — `EmptyState` (icon/title/description
  + CTA children) and `IconBadge` (honey/info, sm/md/lg).
- `components/dashboard/dashboard-skeleton.tsx` — pattern for layout-shaped
  skeletons.
- `components/sidebar` — `MenuItemLink` for navigation (real links),
  `MenuItemButton` for actions.
- `components/common/delete-confirm-dialog.tsx` — one dialog + a `pending` union state instead
  of N copies.
- `hooks/use-local-storage-boolean.ts` — key-change safe, try/catch storage.

If the same markup appears 2+ times, extract it next to these (cva for
variants, `asChild` via `radix-ui` Slot, keep variants object un-exported to
satisfy react-refresh lint).

## 3. Visual polish checklist

- One radius scale: cards `rounded-xl` (via `Card`), rows/inputs `rounded-md`,
  pills `rounded-full`.
- Consistent section rhythm (`space-y-8` between sections, same header
  component everywhere). No stray `mt-*` inside `space-y-*`.
- Skeletons shaped like the final layout instead of `Loading...`; gate on the
  right `isPending`/`isLoading` so empty states never flash.
- Every empty state has a CTA.
- `focus-visible:ring-2 focus-visible:ring-ring` on every clickable surface;
  `active:scale-[0.98]` on cards/menu items.
- Icons sized with `size-*` (`size-4` inline, `size-3.5` in pills).
- No `<button>` inside `<a>`: use the stretched-link card pattern (title `Link`
  with `after:absolute after:inset-0`, interactive bits in a `relative z-10`
  layer).
- Navigation = `Link`, not `navigate()` in onClick. No `alert()`.
- Fraunces (`font-display`) only for large headlines. `font-overline` for small
  caps labels. No arbitrary `text-[10px]` sizes.

## 4. Perf + real bugs (react-best-practices)

Look specifically for:

- **N+1 queries**: per-item `useHive`/`useX(id)` in list cards — check whether
  the list endpoint already returns the field (backend `*.service.ts`).
- Zustand: selector reads (`useStore(s => s.x)`), never whole-store destructure.
- `useMemo` whose input is recreated each render (filter outside memo) → move
  the work inside.
- Derived state in effects → compute during render, `key` reset, or lazy
  `useState` init. Prop→state sync effects in dialogs → `key={item?.id}`.
- Repeated lookups → `Map`; repeated date parsing in sort comparators →
  decorate once, then sort (TS lib is ES2022: `[...arr].sort`, no `toSorted`).
- `Intl.*Format` created per render/item → memoize per `i18n.language`.
- UTC `toISOString()` for "today" → `format(new Date(), 'yyyy-MM-dd')`.
- Effects duplicated across every caller of a hook → move into one
  sync component mounted once (see `useApiarySelectionSync`).
- Barrel imports of heavy modules → import the file directly.
- Mutations: optimistic `onMutate` + rollback for toggles; pending guard and
  error toast on submit; forms use `<form onSubmit>` typed
  `React.SubmitEvent<HTMLFormElement>`.

## 5. Composition (composition-patterns)

- Boolean props that every caller sets the same way → delete them.
- 10+ callback props → one `handlers` object or a context read with `use()`.
- `renderX` props / `headerSlot` → `children`.
- Components defined inside components / giant render functions → module-level
  components, `memo` for list rows.
- Mode booleans → explicit variant components (`MenuItemLink` vs
  `MenuItemButton`).

## 6. i18n

- Every user-visible string, `aria-label` and `alt` goes through `t`.
- Edit **only** `public/locales/en` and `public/locales/sk` (others are
  Weblate). Slovak plurals need `_one`/`_few`/`_many`/`_other`; English
  `_one`/`_other`.
- Relative dates via `Intl.RelativeTimeFormat`, not hand-built strings.
- Preserve each JSON file's trailing newline; prefer colons over em-dashes in
  copy.
- Leave the public/SEO `<title>` strings alone.

## 7. Verify (from `apps/frontend`)

```bash
pnpm typecheck            # never `npx tsc`
pnpm lint                 # or eslint on changed files
env -u LD_LIBRARY_PATH devenv shell -- sh -c 'cd apps/frontend && pnpm test:ct'
```

- Grep `packages/page-objects` and `apps/e2e` for selectors/text you changed
  (button labels, menu items) and keep them matching.
- Format changed TS/TSX with prettier via `xargs` (zsh doesn't word-split
  `$FILES`); never prettier `index.css`.
- If the dev stack is running, check light + dark, desktop + mobile, empty
  states, and the network tab for per-item requests.

## 8. Report

Summarise grouped by: bugs fixed, look & feel, composition, behaviour changes
the user will notice, i18n, and what was deliberately left (with the reason).
Don't commit or push unless asked.
