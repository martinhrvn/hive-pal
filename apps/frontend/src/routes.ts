import {
  type RouteConfig,
  type RouteConfigEntry,
  index,
  layout,
  prefix,
  route,
} from '@react-router/dev/routes';

// Public tool pages, mounted both at the unprefixed (English, canonical) path
// and under `/:lang`. The same route module is used twice, so every entry needs
// an explicit, unique id.
const toolsChildren = (idPrefix: string): RouteConfigEntry[] => [
  index('route-modules/public/tools/index.tsx', { id: `${idPrefix}/tools` }),
  route('syrup-calculator', 'route-modules/public/tools/syrup-calculator.tsx', {
    id: `${idPrefix}/tools/syrup-calculator`,
  }),
  route('brood-timeline', 'route-modules/public/tools/brood-timeline.tsx', {
    id: `${idPrefix}/tools/brood-timeline`,
  }),
  route('swarm-management', 'route-modules/public/tools/swarm-management.tsx', {
    id: `${idPrefix}/tools/swarm-management`,
  }),
  route(
    'swarm-management/demaree',
    'route-modules/public/tools/demaree-method.tsx',
    { id: `${idPrefix}/tools/swarm-management/demaree` },
  ),
  route(
    'swarm-management/pagden',
    'route-modules/public/tools/pagden-method.tsx',
    { id: `${idPrefix}/tools/swarm-management/pagden` },
  ),
  route(
    'swarm-management/artificial',
    'route-modules/public/tools/artificial-swarm-method.tsx',
    { id: `${idPrefix}/tools/swarm-management/artificial` },
  ),
  route('liebefelder', 'route-modules/public/tools/liebefelder.tsx', {
    id: `${idPrefix}/tools/liebefelder`,
  }),
  route(
    'varroa-management',
    'route-modules/public/tools/varroa-management.tsx',
    {
      id: `${idPrefix}/tools/varroa-management`,
    },
  ),
];

// Public, SEO-indexed pages (except the landing page, which at `/` is handled
// by the dashboard layout: logged-out visitors see the landing page there).
const publicPages = (idPrefix: string): RouteConfigEntry[] => [
  route('features', 'route-modules/public/features.tsx', {
    id: `${idPrefix}/features`,
  }),
  route(
    'tools',
    'route-modules/layouts/tools.tsx',
    { id: `${idPrefix}/tools-layout` },
    toolsChildren(idPrefix),
  ),
  route('releases', 'route-modules/public/releases.tsx', {
    id: `${idPrefix}/releases`,
  }),
  route('privacy-policy', 'route-modules/public/privacy-policy.tsx', {
    id: `${idPrefix}/privacy-policy`,
  }),
];

export default [
  // Authenticated app. The layout guards the session and renders the dashboard
  // chrome; at `/` a logged-out visitor gets the landing page instead.
  layout('route-modules/layouts/dashboard.tsx', [
    index('route-modules/app/home.tsx'),

    route('apiaries', 'route-modules/app/apiaries/list.tsx'),
    route('apiaries/:id', 'route-modules/app/apiaries/detail.tsx'),
    layout('route-modules/guards/editable-apiaries.tsx', [
      route('apiaries/create', 'route-modules/app/apiaries/create.tsx'),
      route('apiaries/:id/edit', 'route-modules/app/apiaries/edit.tsx'),
    ]),

    route('hives', 'route-modules/app/hives/list.tsx'),
    route('hives/:id', 'route-modules/app/hives/detail.tsx'),
    route('hives/qr-codes/print', 'route-modules/app/hives/qr-codes-print.tsx'),
    layout('route-modules/guards/editable-hives.tsx', [
      route('hives/create', 'route-modules/app/hives/create.tsx'),
      route('hives/:id/edit', 'route-modules/app/hives/edit.tsx'),
    ]),

    route('inspections', 'route-modules/app/inspections/list.tsx'),
    route('inspections/list/:view', 'route-modules/app/inspections/list.tsx', {
      id: 'app/inspections/list-view',
    }),
    route('inspections/:id', 'route-modules/app/inspections/detail.tsx'),
    layout('route-modules/guards/editable-inspections.tsx', [
      route(
        'hives/:hiveId/inspections/create',
        'route-modules/app/inspections/create.tsx',
        { id: 'app/inspections/create-for-hive' },
      ),
      route('inspections/create', 'route-modules/app/inspections/create.tsx'),
      route(
        'inspections/schedule',
        'route-modules/app/inspections/schedule.tsx',
      ),
      route('inspections/:id/edit', 'route-modules/app/inspections/edit.tsx'),
    ]),

    route('batch-inspections', 'route-modules/app/batch-inspections/list.tsx'),
    route(
      'batch-inspections/:id',
      'route-modules/app/batch-inspections/detail.tsx',
    ),
    route(
      'batch-inspections/:id/inspect',
      'route-modules/app/batch-inspections/inspect.tsx',
    ),

    route('queens', 'route-modules/app/queens/list.tsx'),
    route('queens/:queenId', 'route-modules/app/queens/detail.tsx'),
    layout('route-modules/guards/editable-queens.tsx', [
      route('queens/create', 'route-modules/app/queens/create.tsx'),
      route(
        'hives/:hiveId/queens/create',
        'route-modules/app/queens/create.tsx',
        {
          id: 'app/queens/create-for-hive',
        },
      ),
      route('queens/:queenId/edit', 'route-modules/app/queens/edit.tsx'),
    ]),

    route('todos', 'route-modules/app/todos.tsx'),
    route('harvests', 'route-modules/app/harvests/list.tsx'),
    route('harvests/:harvestId', 'route-modules/app/harvests/detail.tsx'),
    route('equipment', 'route-modules/app/equipment/planning.tsx'),
    route('equipment/settings', 'route-modules/app/equipment/settings.tsx'),
    route('actions/bulk', 'route-modules/app/bulk-actions.tsx'),
    route('calendar', 'route-modules/app/calendar.tsx'),
    route('reports', 'route-modules/app/reports.tsx'),
    route('hivescale', 'route-modules/app/hivescale.tsx'),
    route('assistant', 'route-modules/app/assistant.tsx'),
    route('files', 'route-modules/app/files.tsx'),
    route('settings', 'route-modules/app/settings/user-settings.tsx'),
    route(
      'settings/data-transfer',
      'route-modules/app/settings/data-transfer.tsx',
    ),
    route('feedback', 'route-modules/app/feedback.tsx'),

    layout('route-modules/guards/admin.tsx', [
      ...prefix('admin', [
        route('users', 'route-modules/admin/user-management.tsx'),
        route('users/:id', 'route-modules/admin/user-detail.tsx'),
        route('feedback', 'route-modules/admin/feedback-management.tsx'),
        route('frame-sizes', 'route-modules/admin/frame-size-review.tsx'),
        route('metrics', 'route-modules/admin/platform-metrics.tsx'),
        route('worker-tokens', 'route-modules/admin/worker-tokens.tsx'),
        route('media', 'route-modules/admin/media.tsx'),
      ]),
    ]),
  ]),

  // Auth pages (no dashboard chrome).
  route('login', 'route-modules/auth/login.tsx'),
  route('register', 'route-modules/auth/register.tsx'),
  route('forgot-password', 'route-modules/auth/forgot-password.tsx'),
  route('reset-password', 'route-modules/auth/reset-password.tsx'),
  route('account/change-password', 'route-modules/auth/change-password.tsx'),

  // Logged-in pages rendered without the dashboard chrome.
  layout('route-modules/guards/protected.tsx', [
    route('onboarding', 'route-modules/app/onboarding.tsx'),
    // Fullscreen mobile inspection flows.
    layout(
      'route-modules/guards/editable-inspections.tsx',
      { id: 'guards/editable-inspections-fullscreen' },
      [
        route(
          'hives/:hiveId/inspect/mobile',
          'route-modules/app/inspections/mobile-wizard.tsx',
        ),
        route(
          'hives/:hiveId/inspect/audio',
          'route-modules/app/inspections/audio-quick.tsx',
        ),
      ],
    ),
  ]),

  route('shared/:token', 'route-modules/public/shared.tsx'),
  route('join/:token', 'route-modules/app/join-apiary.tsx'),

  // Public pages at their unprefixed (English, canonical) paths.
  ...publicPages('en'),

  // Language-prefixed public pages (e.g. /da/tools/syrup-calculator). Static
  // paths above rank higher, so this only captures genuine first-segment
  // language codes; unsupported codes render the 404 page (see LangLayout).
  route(':lang', 'route-modules/layouts/lang.tsx', [
    index('route-modules/public/landing.tsx', { id: 'lang/landing' }),
    ...publicPages('lang'),
  ]),

  route('*', 'route-modules/not-found.tsx'),
] satisfies RouteConfig;
