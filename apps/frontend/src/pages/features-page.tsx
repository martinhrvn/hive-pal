import { Link } from 'react-router-dom';
import {
  Mic,
  Wand2,
  Sparkles,
  ClipboardList,
  Layers,
  BarChart3,
  Users,
  ShieldCheck,
  Beaker,
  ArrowUpRight,
  Rocket,
  Github,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PublicMeta } from '@/components/seo/public-meta';
import { useLocalizedPath } from '@/hooks/use-language-navigation';
import { display, sans } from '@/components/marketing/marketing-styles';
import {
  HexBullet,
  SectionLabel,
  MarketingHeader,
  MarketingFooter,
} from '@/components/marketing/marketing-chrome';

interface Feature {
  readonly title: string;
  readonly body: string;
}

interface FeatureGroup {
  readonly id: string;
  readonly label: string;
  readonly title: string;
  readonly lede: string;
  readonly features: readonly Feature[];
}

// Comprehensive, grouped feature catalogue. Each group becomes a <section> with
// an <h2>, and each feature an <h3> — semantic, crawlable, and easy for LLMs to
// extract. Keep bodies factual: they describe what Hive Pal actually does.
const GROUPS: readonly FeatureGroup[] = [
  {
    id: 'inspections',
    label: 'Inspections & record-keeping',
    title: 'Every inspection, captured in detail',
    lede: 'Record what you see at the hive with structured, repeatable inspections — then find it again the moment you need it.',
    features: [
      {
        title: 'Structured inspections',
        body: 'Log brood pattern, stores, temperament, space, and queen status with consistent fields, so colonies are comparable across visits and seasons.',
      },
      {
        title: 'Quick checks',
        body: 'A lightweight inspection flow for fast yard walk-throughs when you only need to note the essentials and move on.',
      },
      {
        title: 'Batch inspections',
        body: 'Inspect a whole apiary in one sitting — step through every hive in sequence without re-opening each record by hand.',
      },
      {
        title: 'Scheduled inspections & reminders',
        body: 'Plan future visits and get release-note and task reminders so nothing slips between sessions.',
      },
      {
        title: 'Photos & observations',
        body: 'Attach photos and free-text notes to any inspection to document disease signs, comb, or anything worth a second look.',
      },
      {
        title: 'Actions & treatments',
        body: 'Record feeding, treatments, and management actions as part of the inspection, building a full history per colony.',
      },
    ],
  },
  {
    id: 'colony',
    label: 'Colony & hive management',
    title: 'Organize apiaries, hives, and queens',
    lede: 'A clear model of your operation — from yards down to individual frames and queen lineages.',
    features: [
      {
        title: 'Multiple apiaries',
        body: 'Group hives by location with site-specific notes and local weather context for each yard.',
      },
      {
        title: 'Hive configuration',
        body: 'Track boxes, frames, and configuration per hive so the record reflects the real equipment in the field.',
      },
      {
        title: 'Queen tracking',
        body: 'Follow each queen’s marking, origin, lineage, performance, and replacement history to keep colonies strong.',
      },
      {
        title: 'Equipment planning',
        body: 'Plan and account for boxes, frames, and gear across your hives so you know what to build before the season.',
      },
      {
        title: 'QR codes',
        body: 'Generate and print QR labels for hives, then scan in the apiary to jump straight to the right record.',
      },
      {
        title: 'Hive scale monitoring',
        body: 'Connect hive scales to follow weight trends — nectar flow, consumption, and overwintering at a glance.',
      },
    ],
  },
  {
    id: 'planning',
    label: 'Planning & insight',
    title: 'See the season, not just the day',
    lede: 'Turn your records into a plan and a picture of how the operation is doing.',
    features: [
      {
        title: 'Calendar',
        body: 'A unified calendar of inspections and scheduled tasks across every apiary, so the week ahead is always visible.',
      },
      {
        title: 'Reports & analytics',
        body: 'Roll your data up into colony-health and productivity reports to spot trends and weak hives early.',
      },
      {
        title: 'Harvest tracking',
        body: 'Record honey harvests, processing dates, and yields across hives and seasons to measure real output.',
      },
      {
        title: 'AI assistant',
        body: 'Ask questions about your apiary and get help making sense of your records, right inside the app.',
      },
      {
        title: 'Bulk actions',
        body: 'Apply the same action across many hives at once instead of editing them one by one.',
      },
    ],
  },
  {
    id: 'collaboration',
    label: 'Collaboration & sharing',
    title: 'Beekeeping is rarely a solo job',
    lede: 'Work the bees with partners, clubs, or mentees — and share what matters without handing over the keys.',
    features: [
      {
        title: 'Apiary sharing',
        body: 'Invite other beekeepers to collaborate on an apiary so the whole team works from the same records.',
      },
      {
        title: 'Invite links',
        body: 'Share a join link to bring someone into an apiary quickly, without manual account juggling.',
      },
      {
        title: 'Shared views',
        body: 'Give read access to colonies or data so a mentor or club can follow along without editing.',
      },
    ],
  },
  {
    id: 'data',
    label: 'Your data, your rules',
    title: 'Open source, private, and portable',
    lede: 'Hive Pal is free software you can run yourself — your records stay yours.',
    features: [
      {
        title: 'Open source (MIT)',
        body: 'The entire app is MIT-licensed. Read it, fork it, audit it, or contribute — no black boxes.',
      },
      {
        title: 'Self-hostable',
        body: 'Run it anywhere Docker runs: a server, a laptop, or a Raspberry Pi. The hosted version runs the same code.',
      },
      {
        title: 'Import & export',
        body: 'Move your data in and out freely. Your beekeeping history is never locked inside the app.',
      },
      {
        title: 'Privacy-first AI',
        body: 'The voice and AI stack uses open models (faster-whisper + Ollama) and can run on your own hardware — no third-party cloud required.',
      },
      {
        title: 'Multilingual',
        body: 'Use Hive Pal in your language, with community translations managed through Weblate and growing over time.',
      },
      {
        title: 'Installable & offline-ready',
        body: 'Install it as a PWA on your phone and keep working in the apiary even when the signal drops.',
      },
    ],
  },
];

// AI is the headline capability — given its own emphasised dark section.
const AI_FEATURES: readonly { icon: React.ReactNode; title: string; body: string }[] =
  [
    {
      icon: <Mic className="h-5 w-5" />,
      title: 'Record at the hive',
      body: 'Tap record and talk through each frame. Audio uploads straight into the inspection — even if you lose signal mid-yard.',
    },
    {
      icon: <Wand2 className="h-5 w-5" />,
      title: 'Automatic transcription',
      body: 'Whisper-powered speech-to-text turns every recording into a searchable transcript attached to the inspection. Multilingual out of the box.',
    },
    {
      icon: <Sparkles className="h-5 w-5" />,
      title: 'AI-drafted notes',
      body: 'Local LLMs extract queen sightings, brood patterns, treatments, and observations into a pre-filled inspection — you just review and save.',
    },
  ];

const GROUP_ICONS: Record<string, React.ReactNode> = {
  inspections: <ClipboardList className="h-5 w-5" />,
  colony: <Layers className="h-5 w-5" />,
  planning: <BarChart3 className="h-5 w-5" />,
  collaboration: <Users className="h-5 w-5" />,
  data: <ShieldCheck className="h-5 w-5" />,
};

const allFeatureNames = [
  'AI voice inspections',
  'Automatic transcription',
  'AI-drafted inspection notes',
  ...GROUPS.flatMap(g => g.features.map(f => f.title)),
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Hive Pal Features',
  description:
    'A complete overview of Hive Pal: AI voice inspections, hive and queen management, planning and reports, collaboration, and open-source, self-hostable, privacy-first software.',
  url: 'https://hivepal.app/features',
  about: {
    '@type': 'SoftwareApplication',
    name: 'Hive Pal',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    featureList: allFeatureNames,
  },
  mainEntity: {
    '@type': 'ItemList',
    itemListElement: GROUPS.map((group, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: group.title,
      description: group.lede,
    })),
  },
};

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80"
      style={sans}
    >
      <span className="h-px w-8 bg-amber-300/70" />
      <span>{children}</span>
    </div>
  );
}

export function FeaturesPage() {
  const localize = useLocalizedPath();
  return (
    <div
      className="min-h-screen w-full bg-[#FBF5EA] text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900"
      style={sans}
    >
      <PublicMeta
        title="Features — Everything Hive Pal Does for Beekeepers"
        description="Explore every Hive Pal feature: AI voice inspections with automatic transcription, hive and queen management, batch inspections, planning and reports, harvest tracking, collaboration, and open-source, self-hostable, privacy-first software."
        ogTitle="Hive Pal Features — AI Voice Inspections & Beekeeping Management"
        ogDescription="AI voice inspections, hive & queen management, planning, reports, collaboration, and open-source self-hosting. See everything Hive Pal does."
        ogImage="https://hivepal.app/og-image.jpg"
        twitterCard="summary_large_image"
        path="/features"
        structuredData={jsonLd}
      />

      <MarketingHeader />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-stone-900/10 bg-[#FBF5EA] py-20 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23292524' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <div className="flex justify-center">
            <SectionLabel>Everything in one place</SectionLabel>
          </div>
          <h1
            className="mt-6 text-[clamp(2.5rem,5.5vw,4rem)] font-medium leading-[1.04] tracking-tight text-stone-900"
            style={{
              ...display,
              fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
            }}
          >
            Everything you need to{' '}
            <span
              className="text-amber-700"
              style={{
                ...display,
                fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 600",
              }}
            >
              run the bees
            </span>
            .
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-stone-600">
            Hive Pal brings voice-first AI inspections, colony and queen
            records, planning, reports, and collaboration into a single
            open-source platform — free to use and yours to host.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-stone-900 px-6 text-amber-50 hover:bg-stone-800"
            >
              <Link to="/register">
                <Rocket className="mr-2 h-4 w-4" />
                Sign up — it&apos;s free
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                Self-host
              </a>
            </Button>
          </div>
          <div
            className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-stone-500"
            style={sans}
          >
            <span className="h-px flex-1 bg-stone-900/15" />
            <span>MIT licensed · self-hostable · voice-first</span>
            <span className="h-px flex-1 bg-stone-900/15" />
          </div>
        </div>
      </section>

      {/* AI — headline capability, emphasised dark section */}
      <section className="relative overflow-hidden bg-[#15201E] py-24 text-amber-50 sm:py-28">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23E8C76A' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div
          aria-hidden="true"
          className="absolute -top-32 right-[-10%] h-[420px] w-[420px] rounded-full bg-amber-500/12 blur-3xl"
        />
        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Eyebrow>Voice &amp; AI</Eyebrow>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl"
                style={{
                  ...display,
                  fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                }}
              >
                Inspect with your voice,
                <br />
                <span className="text-amber-200" style={display}>
                  not your keyboard
                </span>
                .
              </h2>
            </div>
            <div className="lg:col-span-5">
              <p className="text-base leading-relaxed text-amber-50/75">
                Record audio during inspections, transcribe it automatically,
                and let AI draft structured notes — so the busywork happens
                while you&apos;re still at the apiary.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-amber-50/10 lg:grid-cols-3">
            {AI_FEATURES.map(item => (
              <div
                key={item.title}
                className="group relative bg-[#15201E] p-8 transition-colors hover:bg-[#1a2826]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-400/15 text-amber-200">
                  {item.icon}
                </div>
                <h3
                  className="mt-6 text-lg font-semibold text-amber-50"
                  style={sans}
                >
                  {item.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-amber-50/70">
                  {item.body}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-14 max-w-3xl text-center">
            <p
              className="text-base leading-relaxed text-amber-50/85"
              style={sans}
            >
              <span className="font-semibold text-amber-100">
                Your recordings, your models.
              </span>{' '}
              The AI stack runs on open-source models and can be self-hosted
              alongside your data — or run as a pull worker on your home machine.
            </p>
          </div>
        </div>
      </section>

      {/* Feature groups */}
      {GROUPS.map((group, index) => (
        <section
          key={group.id}
          id={group.id}
          className={`border-b border-stone-900/10 py-20 sm:py-24 ${
            index % 2 === 0 ? 'bg-[#FBF5EA]' : 'bg-[#F4ECDB]'
          }`}
        >
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <SectionLabel>{group.label}</SectionLabel>
                <h2
                  className="mt-5 text-3xl leading-[1.06] tracking-tight text-stone-900 sm:text-4xl"
                  style={{
                    ...display,
                    fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                  }}
                >
                  {group.title}
                </h2>
                <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                  {group.lede}
                </p>
              </div>
              <div className="hidden h-12 w-12 flex-none items-center justify-center rounded-xl bg-stone-900/5 text-stone-700 sm:flex">
                {GROUP_ICONS[group.id]}
              </div>
            </div>

            <dl className="mt-14 grid grid-cols-1 gap-x-10 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
              {group.features.map(feature => (
                <div key={feature.title} className="group relative">
                  <div className="flex items-center gap-3">
                    <HexBullet />
                    <span className="h-px flex-1 bg-stone-900/10 transition-colors group-hover:bg-amber-700/40" />
                  </div>
                  <dt
                    className="mt-3 text-lg font-semibold text-stone-900"
                    style={sans}
                  >
                    {feature.title}
                  </dt>
                  <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                    {feature.body}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </section>
      ))}

      {/* Free tools strip */}
      <section className="border-b border-stone-900/10 bg-[#FBF5EA] py-20 sm:py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <SectionLabel>No signup required</SectionLabel>
              <h2
                className="mt-5 text-3xl leading-[1.06] tracking-tight text-stone-900 sm:text-4xl"
                style={{
                  ...display,
                  fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
                }}
              >
                Free tools you can use right now
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                Calculators and planners that work in the browser, no account
                needed — a taste of how Hive Pal thinks about beekeeping.
              </p>
            </div>
            <Link
              to={localize('/tools')}
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              <Beaker className="h-4 w-4" />
              See all tools
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#FBF5EA] py-24 sm:py-28">
        <div className="relative mx-auto max-w-3xl px-6 text-center">
          <img
            src="/hive-pal-logo.png"
            alt=""
            aria-hidden="true"
            className="mx-auto h-14 w-14 opacity-90"
          />
          <h2
            className="mt-8 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
            style={{
              ...display,
              fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500",
            }}
          >
            Ready to{' '}
            <span className="text-amber-700" style={display}>
              try it
            </span>
            ?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            Sign up for the hosted version, or grab the source and run it
            yourself. Either way, it&apos;s free.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-stone-900 px-6 text-amber-50 hover:bg-stone-800"
            >
              <Link to="/register">
                Sign up free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
            >
              <a
                href="https://github.com/martinhrvn/hive-pal"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>
      </section>

      <MarketingFooter />
    </div>
  );
}
