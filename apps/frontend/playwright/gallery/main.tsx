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

function getRoot(): Root {
  const el = document.getElementById('root');
  if (!el) throw new Error('Gallery root element #root is missing');
  root ??= createRoot(el);
  return root;
}

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
  getRoot().render(
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

// Browse mode, for opening the gallery by hand (pnpm gallery): the index lists
// every story, and ?story=<id>&props=<json> renders one. Tests drive
// window.mount instead, so it stays off under automation.
const StoryIndex = () => {
  const groups = new Map<string, string[]>();
  for (const id of [...registry.keys()].sort()) {
    const dir = id.slice(0, id.lastIndexOf('/'));
    groups.set(dir, [...(groups.get(dir) ?? []), id]);
  }
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <h1 className="text-xl font-semibold">Stories</h1>
      <p className="text-sm text-muted-foreground">
        Add <code>&amp;props=&#123;...&#125;</code> (JSON) to a story URL to
        pass props. Stories whose data comes from mocked API calls in their spec
        render empty here.
      </p>
      {[...groups].map(([dir, ids]) => (
        <section key={dir} className="space-y-1">
          <h2 className="font-mono text-sm text-muted-foreground">{dir}</h2>
          <ul className="list-inside list-disc">
            {ids.map(id => (
              <li key={id}>
                <a
                  className="text-sm underline"
                  href={`?story=${encodeURIComponent(id)}`}
                >
                  {id.slice(dir.length + 1)}
                </a>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </main>
  );
};

async function browse(): Promise<void> {
  const params = new URLSearchParams(location.search);
  const story = params.get('story');
  if (story) {
    const props = params.get('props');
    await mount({ story, props: props ? JSON.parse(props) : undefined });
  } else {
    getRoot().render(<StoryIndex />);
  }
}

if (!navigator.webdriver) void browse();
