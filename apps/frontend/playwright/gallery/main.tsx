import { createRoot, type Root } from 'react-dom/client';
import type { ComponentType } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthContext } from '../../src/context/auth-context/auth-context';
import { ThemeProvider } from '../../src/context/theme-provider';
import '../../src/index.css';
import '../../src/lib/i18n';
import i18n from 'i18next';

// Stories take arbitrary serialisable props from the test; the gallery only
// forwards them, so a loose props type is enough here.
type Story = ComponentType<Record<string, unknown>>;

// Discover every story file next to the components. Story ids are the path
// under src/ without the `.story.tsx` suffix, plus the export name, e.g.
// `components/common/numeric-input-field/NumericInputFieldWithIcon`.
const storyModules = import.meta.glob('../../src/**/*.story.tsx', {
  eager: true,
}) as Record<string, Record<string, Story>>;

const registry = new Map<string, Story>();
for (const [path, mod] of Object.entries(storyModules)) {
  const base = path.replace('../../src/', '').replace(/\.story\.tsx$/, '');
  for (const [exportName, Component] of Object.entries(mod)) {
    if (exportName === 'default' || typeof Component !== 'function') continue;
    registry.set(`${base}/${exportName}`, Component);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// ThemeProvider calls useAuth(), which throws without an AuthProvider above it.
// Stories render in isolation (no real session/router), so provide a stable
// logged-out stub instead of the real AuthProvider.
const authStub = {
  user: null,
  isLoggedIn: false,
  isLoading: false,
  login: async () => false,
  register: async () => false,
  logout: async () => {},
};

async function ensureI18n() {
  if (!i18n.isInitialized) {
    await new Promise<void>(resolve => {
      i18n.on('initialized', () => resolve());
    });
  }
  await i18n.loadNamespaces([
    'common',
    'inspection',
    'apiary',
    'hive',
    'queen',
    'auth',
    'onboarding',
  ]);
}

let root: Root | null = null;

export interface MountParams {
  story: string;
  props?: Record<string, unknown>;
}

async function mount({ story, props }: MountParams): Promise<void> {
  const Component = registry.get(story);
  if (!Component) {
    throw new Error(
      `Unknown story "${story}". Available: ${[...registry.keys()].join(', ')}`,
    );
  }
  await ensureI18n();
  const el = document.getElementById('root');
  if (!el) throw new Error('Gallery root element #root is missing');
  if (!root) root = createRoot(el);
  root.render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={authStub}>
        <ThemeProvider defaultTheme="light">
          <Component {...props} />
        </ThemeProvider>
      </AuthContext.Provider>
    </QueryClientProvider>,
  );
}

async function unmount(): Promise<void> {
  root?.unmount();
  root = null;
  const el = document.getElementById('root');
  if (el) el.innerHTML = '';
}

declare global {
  interface Window {
    mount: typeof mount;
    unmount: typeof unmount;
  }
}

window.mount = mount;
window.unmount = unmount;
