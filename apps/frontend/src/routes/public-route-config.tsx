import type { RouteObject } from 'react-router-dom';
import { LandingPage } from '@/pages/landing-page';
import { FeaturesPage } from '@/pages/features-page';
import { ToolsIndexPage } from '@/pages/tools/tools-index-page';
import { SyrupCalculatorPage } from '@/pages/tools/syrup-calculator-page';
import { BroodTimelinePage } from '@/pages/tools/brood-timeline-page';
import { SwarmManagementOverviewPage } from '@/pages/tools/swarm-management-overview-page';
import { DemareeMethodPage } from '@/pages/tools/demaree-method-page';
import { LiebefelderPage } from '@/pages/tools/liebefelder-page';
import { ReleasesPage } from '@/pages/releases';
import { PrivacyPolicyPage } from '@/pages/privacy-policy-page';
import { PublicLayout } from '@/components/layout/public-layout';
import { LangLayout } from '@/components/i18n/lang-layout';

// SSR/prerender route table. Mirrors the public routes in routes/index.tsx, but
// with direct (non-lazy) imports so renderToString resolves them synchronously,
// and with `tools` wrapped in PublicLayout directly (prerendering always renders
// the logged-out public view, never the dashboard).
const toolsChildren: RouteObject[] = [
  { index: true, element: <ToolsIndexPage /> },
  { path: 'syrup-calculator', element: <SyrupCalculatorPage /> },
  { path: 'brood-timeline', element: <BroodTimelinePage /> },
  { path: 'swarm-management', element: <SwarmManagementOverviewPage /> },
  { path: 'swarm-management/demaree', element: <DemareeMethodPage /> },
  { path: 'liebefelder', element: <LiebefelderPage /> },
];

const langChildren: RouteObject[] = [
  { index: true, element: <LandingPage /> },
  { path: 'features', element: <FeaturesPage /> },
  { path: 'tools', element: <PublicLayout />, children: toolsChildren },
  { path: 'releases', element: <ReleasesPage /> },
  { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
];

export const serverPublicRoutes: RouteObject[] = [
  { path: '/', element: <LandingPage /> },
  { path: '/features', element: <FeaturesPage /> },
  { path: '/tools', element: <PublicLayout />, children: toolsChildren },
  { path: '/releases', element: <ReleasesPage /> },
  { path: '/privacy-policy', element: <PrivacyPolicyPage /> },
  { path: '/:lang', element: <LangLayout />, children: langChildren },
];
