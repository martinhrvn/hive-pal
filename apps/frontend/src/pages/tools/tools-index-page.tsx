import { Beaker, Bug, Waypoints } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ToolMeta, ToolPageHeader } from '@/components/tool-page';
import { useLocalizedPath } from '@/hooks/use-language-navigation';

const TOOLS = [
  {
    to: '/tools/syrup-calculator',
    icon: Beaker,
    title: 'Sugar Syrup Calculator',
    description:
      'Precise sugar and water amounts for 1:1, 3:2, or 2:1 syrup at any container size. Metric or imperial.',
  },
  {
    to: '/tools/brood-timeline',
    icon: Bug,
    title: 'Brood Development Timeline',
    description:
      'Visualize queen, worker, and drone brood stages with day counts and project dates from any starting day.',
  },
  {
    to: '/tools/swarm-management',
    icon: Waypoints,
    title: 'Swarm Management',
    description:
      'Step-by-step Demaree swarm-control workflow with follow-up timing and an inspection planner.',
  },
];

const structuredData = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Free Beekeeping Tools',
  url: 'https://hivepal.app/tools',
  description:
    'Free, open-source calculators and reference guides for beekeepers — sugar syrup, brood timelines, and swarm management.',
  isAccessibleForFree: true,
  publisher: {
    '@type': 'Organization',
    name: 'Hive Pal',
    url: 'https://hivepal.app',
  },
  hasPart: TOOLS.map(tool => ({
    '@type': 'WebPage',
    name: tool.title,
    url: `https://hivepal.app${tool.to}`,
    description: tool.description,
  })),
};

export function ToolsIndexPage() {
  const localize = useLocalizedPath();
  // The tools index has no aside, so it spans the full width rather than the
  // 2/3 MainContent column used by the tool detail pages.
  return (
    <>
      <ToolMeta
        title="Free Beekeeping Tools — Hive Pal"
        description="Free, open-source calculators and reference guides for beekeepers. Sugar syrup calculator, brood development timeline, and swarm management workflows."
        ogDescription="Free calculators and reference guides for beekeepers — no signup required."
        path="/tools"
        structuredData={structuredData}
      />

      <ToolPageHeader
        eyebrow="Free Tools"
        title="Beekeeping tools, no signup required"
        intro="Open-source calculators and reference guides you can use directly in the browser. Bookmark them for the apiary."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {TOOLS.map(({ to, icon: Icon, title, description }) => (
          <Link
            key={to}
            to={localize(to)}
            className="group rounded-2xl border border-border bg-card p-6 shadow-sm transition hover:border-amber-300 hover:shadow-md"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-amber-100 p-2">
                <Icon className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-foreground group-hover:text-amber-700">
                {title}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </Link>
        ))}
      </div>
    </>
  );
}
