import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  Github,
  BookOpen,
  Rocket,
  Mic,
  Sparkles,
  Wand2,
  Beaker,
  Bug,
  Waypoints,
  ArrowUpRight,
} from 'lucide-react';

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'Hive Pal',
  description:
    'Free and open-source beekeeping management platform with AI-powered voice inspections. Record audio in the apiary, get automatic transcripts, and let AI draft your inspection notes.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
  url: 'https://hivepal.app',
  author: {
    '@type': 'Organization',
    name: 'Hive Pal',
  },
};

const display = {
  fontFamily:
    "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
};
const sans = { fontFamily: "'Manrope', ui-sans-serif, system-ui, sans-serif" };

function HexBullet() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="h-3.5 w-3.5 flex-none text-amber-600"
    >
      <path
        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
        fill="currentColor"
        opacity="0.18"
      />
      <path
        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-stone-600"
      style={sans}
    >
      <span className="h-px w-8 bg-amber-600/70" />
      <span>{children}</span>
    </div>
  );
}

export function LandingPage() {
  return (
    <div
      className="min-h-screen w-full bg-[#FBF5EA] text-stone-900 antialiased selection:bg-amber-200 selection:text-stone-900"
      style={sans}
    >
      <Helmet>
        <title>Hive Pal — AI-Powered Beekeeping Management Software</title>
        <meta
          name="description"
          content="Manage your beehives efficiently with Hive Pal. Record voice notes at the hive and let AI transcribe and draft your inspections. Open source, self-hostable, and free for early adopters."
        />
        <link rel="canonical" href="https://hivepal.app/" />
        <meta
          property="og:title"
          content="Hive Pal — AI-Powered Beekeeping Management Software"
        />
        <meta
          property="og:description"
          content="Free, open-source beekeeping platform with AI voice inspections. Record audio in the apiary and let AI draft your inspection notes automatically."
        />
        <meta property="og:url" content="https://hivepal.app/" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://hivepal.app/og-image.jpg" />
        <meta property="twitter:card" content="summary_large_image" />
        <meta
          property="twitter:title"
          content="Hive Pal — AI-Powered Beekeeping Management Software"
        />
        <meta
          property="twitter:description"
          content="Free, open-source beekeeping platform with AI voice inspections. Record audio in the apiary and let AI draft your inspection notes automatically."
        />
        <meta
          property="twitter:image"
          content="https://hivepal.app/og-image.jpg"
        />
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      </Helmet>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stone-900/10 bg-[#FBF5EA]/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 sm:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/hive-pal-logo.png"
              alt="Hive Pal"
              className="h-9 w-9 select-none"
              draggable={false}
            />
            <span
              className="text-lg font-semibold tracking-tight text-stone-900"
              style={sans}
            >
              Hive Pal
            </span>
          </Link>

          <nav
            className="hidden items-center gap-8 text-sm text-stone-700 md:flex"
            style={sans}
          >
            <Link
              to="/tools"
              className="transition-colors hover:text-stone-900"
            >
              Free tools
            </Link>
            <a
              href="https://docs.hivepal.app"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-stone-900"
            >
              Documentation
            </a>
            <Link
              to="/releases"
              className="transition-colors hover:text-stone-900"
            >
              Release notes
            </Link>
            <a
              href="https://github.com/martinhrvn/hive-pal"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 transition-colors hover:text-stone-900"
            >
              <Github className="h-4 w-4" />
              GitHub
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              asChild
              className="hidden text-stone-700 hover:bg-stone-900/5 hover:text-stone-900 sm:inline-flex"
            >
              <Link to="/login">Sign in</Link>
            </Button>
            <Button
              asChild
              className="bg-stone-900 text-amber-50 shadow-sm hover:bg-stone-800"
            >
              <Link to="/register">
                Start free
                <ArrowUpRight className="ml-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative flex min-h-[640px] items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero3.jpg')] bg-cover bg-center" />
        {/* Stronger overlay for legibility: dark wash + radial focus behind text */}
        <div className="absolute inset-0 bg-gradient-to-b from-stone-950/55 via-stone-950/55 to-stone-950/75" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(15,12,8,0.55)_0%,rgba(15,12,8,0)_65%)]" />
        <div
          className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 160 160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 0.95  0 0 0 0 0.9  0 0 0 0 0.75  0 0 0 0.7 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
          }}
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-stone-950/60 px-3.5 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-amber-100 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-300" />
            New · AI voice inspections
          </div>

          <h1
            className="mt-8 text-[clamp(2.75rem,6vw,5rem)] font-medium leading-[1.02] tracking-tight text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.7)]"
            style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
          >
            Your open-source
            <br />
            beekeeping{' '}
            <span
              className="text-amber-300"
              style={{
                ...display,
                fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 600",
              }}
            >
              companion
            </span>
            .
          </h1>

          <p
            className="mx-auto mt-7 max-w-2xl text-lg font-normal leading-relaxed text-white drop-shadow-[0_1px_8px_rgba(0,0,0,0.7)]"
            style={sans}
          >
            Record voice notes at the hive. Let AI transcribe and draft your
            inspections automatically — so you keep your hands on the frames,
            not the keyboard.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button
              size="lg"
              asChild
              className="bg-amber-400 px-6 text-stone-950 shadow-[0_8px_30px_-8px_rgba(245,158,11,0.55)] hover:bg-amber-300"
            >
              <Link to="/register">
                <Rocket className="mr-2 h-4 w-4" />
                Sign up — it's free
              </Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              asChild
              className="border-amber-50/40 bg-stone-950/20 px-6 text-amber-50 backdrop-blur-sm hover:bg-amber-50 hover:text-stone-900"
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
            className="mx-auto mt-12 flex max-w-md items-center justify-center gap-4 text-[11px] font-medium uppercase tracking-[0.22em] text-white/85 drop-shadow-[0_1px_4px_rgba(0,0,0,0.6)]"
            style={sans}
          >
            <span className="h-px flex-1 bg-white/40" />
            <span>MIT licensed · self-hostable · voice-first</span>
            <span className="h-px flex-1 bg-white/40" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative border-b border-stone-900/10 bg-[#FBF5EA] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionLabel>Modern beekeeping</SectionLabel>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
              >
                Everything you need to{' '}
                <span className="text-amber-700" style={display}>
                  tend
                </span>{' '}
                your hives.
              </h2>
              <p className="mt-6 max-w-md text-base leading-relaxed text-stone-600">
                Professional tools designed by beekeepers, for beekeepers — to
                keep colonies healthy, productive, and well-documented through
                every season.
              </p>
              <div className="mt-8 h-px w-16 bg-stone-900/30" />
              <p
                className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-stone-500"
                style={sans}
              >
                Four pillars · built into one platform
              </p>
            </div>

            <div className="lg:col-span-7">
              <dl className="grid grid-cols-1 gap-x-10 gap-y-12 sm:grid-cols-2">
                {[
                  {
                    title: 'Apiary management',
                    body: 'Organize and track multiple apiaries with detailed location information, weather data, and site-specific notes.',
                  },
                  {
                    title: 'Hive inspections',
                    body: 'Schedule and record detailed inspections with customizable checklists, photos, and health assessments.',
                  },
                  {
                    title: 'Queen tracking',
                    body: 'Monitor queen performance, breeding records, and replacement schedules to maintain strong colonies.',
                  },
                  {
                    title: 'Harvest management',
                    body: 'Track honey production, processing dates, and yields across seasons and hive locations.',
                  },
                ].map(item => (
                  <div key={item.title} className="group relative">
                    <div className="flex items-center gap-3">
                      <HexBullet />
                      <span className="h-px flex-1 bg-stone-900/10 transition-colors group-hover:bg-amber-700/40" />
                    </div>
                    <dt
                      className="mt-3 text-lg font-semibold text-stone-900"
                      style={sans}
                    >
                      {item.title}
                    </dt>
                    <dd className="mt-2 text-sm leading-relaxed text-stone-600">
                      {item.body}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="relative overflow-hidden bg-[#15201E] py-24 text-amber-50 sm:py-32">
        {/* Subtle hexagon pattern */}
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
        <div
          aria-hidden="true"
          className="absolute -bottom-40 left-[-10%] h-[480px] w-[480px] rounded-full bg-emerald-500/10 blur-3xl"
        />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid items-end gap-10 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div
                className="flex items-center gap-3 text-xs font-medium uppercase tracking-[0.22em] text-amber-200/80"
                style={sans}
              >
                <span className="h-px w-8 bg-amber-300/70" />
                <span>Voice &amp; AI</span>
              </div>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
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
                Hive Pal records audio during inspections, transcribes it
                automatically, and uses AI to draft structured notes — so the
                busywork happens while you're still at the apiary.
              </p>
            </div>
          </div>

          <div className="mx-auto mt-16 grid grid-cols-1 gap-px overflow-hidden rounded-2xl bg-amber-50/10 lg:grid-cols-3">
            {[
              {
                icon: <Mic className="h-5 w-5" />,
                title: 'Record at the hive',
                body: 'Tap record on your phone, talk through what you see on each frame, and move on. Recordings upload straight into the inspection — even if you lose signal mid-yard.',
              },
              {
                icon: <Wand2 className="h-5 w-5" />,
                title: 'Automatic transcription',
                body: 'Whisper-powered speech-to-text turns every recording into a searchable transcript attached to the inspection. Multilingual out of the box.',
              },
              {
                icon: <Sparkles className="h-5 w-5" />,
                title: 'AI-drafted notes',
                body: 'Local LLMs extract queen sightings, brood patterns, treatments and observations into a pre-filled inspection — you just review and save.',
              },
            ].map(item => (
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

          {/* Assurance */}
          <div className="mx-auto mt-14 max-w-3xl text-center">
            <p
              className="text-base leading-relaxed text-amber-50/85 sm:text-lg"
              style={sans}
            >
              <span className="font-semibold text-amber-100">
                Your recordings, your models.
              </span>{' '}
              The AI stack runs on open-source models (faster-whisper + Ollama)
              and can be self-hosted alongside your data — or run as a pull
              worker on your home machine.
            </p>
            <p
              className="mt-4 text-[11px] font-medium uppercase tracking-[0.24em] text-amber-200/70"
              style={sans}
            >
              No third-party cloud required
            </p>
          </div>
        </div>
      </section>

      {/* Pricing / Open Source */}
      <section className="border-b border-stone-900/10 bg-[#FBF5EA] py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="flex justify-center">
              <SectionLabel>How to run it</SectionLabel>
            </div>
            <h2
              className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
              style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
            >
              Self-host, or let us{' '}
              <span className="text-amber-700" style={display}>
                run it
              </span>{' '}
              for you.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-stone-600">
              Two ways to use Hive Pal — both free, both run the same
              open-source code.
            </p>
          </div>

          <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 lg:grid-cols-2">
            {/* Self-Hosted */}
            <div className="relative rounded-3xl border border-stone-900/10 bg-white/60 p-10 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <h3
                  className="text-2xl font-semibold text-stone-900"
                  style={sans}
                >
                  Self-hosted
                </h3>
                <span className="text-sm text-stone-500">Free, forever</span>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-stone-600">
                Full control over your data and infrastructure. Run it on your
                own server, your laptop, a Raspberry Pi — wherever suits you.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-stone-700">
                {[
                  'MIT licensed — read, fork, ship',
                  'Host anywhere Docker runs',
                  'Your data stays on your hardware',
                  'Community support via GitHub',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <HexBullet />
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 h-px bg-stone-900/10" />
              <Button
                variant="outline"
                size="lg"
                className="mt-6 w-full border-stone-900/20 bg-transparent text-stone-900 hover:bg-stone-900 hover:text-amber-50"
                asChild
              >
                <a
                  href="https://github.com/martinhrvn/hive-pal"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <BookOpen className="mr-2 h-4 w-4" />
                  Read the docs
                </a>
              </Button>
            </div>

            {/* Cloud Hosted */}
            <div className="relative rounded-3xl border border-amber-700/40 bg-stone-900 p-10 text-amber-50 shadow-[0_30px_60px_-30px_rgba(0,0,0,0.4)]">
              <div className="flex items-center justify-between">
                <h3
                  className="text-2xl font-semibold text-amber-50"
                  style={sans}
                >
                  Hosted by us
                </h3>
                <span className="text-sm text-amber-200/80">Free</span>
              </div>

              <p className="mt-6 text-sm leading-relaxed text-amber-50/75">
                Zero setup required. We run the servers, handle updates, and
                keep things ticking. Same open-source app — just on our
                hardware.
              </p>

              <ul className="mt-8 space-y-3 text-sm text-amber-50/85">
                {[
                  'Sign up and go — no installation',
                  'Automatic updates & backups',
                  'Best-effort uptime, monitored',
                  'Community support via GitHub',
                ].map(item => (
                  <li key={item} className="flex items-center gap-3">
                    <svg
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                      className="h-3.5 w-3.5 flex-none text-amber-300"
                    >
                      <path
                        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
                        fill="currentColor"
                        opacity="0.25"
                      />
                      <path
                        d="M12 2.5l8.66 5v9l-8.66 5-8.66-5v-9l8.66-5z"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.4"
                      />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="mt-10 h-px bg-amber-50/10" />
              <Button
                size="lg"
                className="mt-6 w-full bg-amber-400 text-stone-950 hover:bg-amber-300"
                asChild
              >
                <Link to="/register">
                  Sign up — it's free
                  <ArrowUpRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Free Tools */}
      <section className="border-b border-stone-900/10 bg-[#F4ECDB] py-24 sm:py-28">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <SectionLabel>Free tools</SectionLabel>
              <h2
                className="mt-6 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-5xl"
                style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
              >
                Free tools, no signup.
              </h2>
              <p className="mt-4 max-w-xl text-base leading-relaxed text-stone-600">
                Handy calculators and planners you can use directly in the
                browser — bookmark them for the apiary.
              </p>
            </div>
            <Link
              to="/tools"
              className="inline-flex items-center gap-2 text-sm font-medium text-stone-900 underline-offset-4 hover:underline"
            >
              See all tools
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-2xl border border-stone-900/10 bg-stone-900/10 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                to: '/tools/syrup-calculator',
                icon: <Beaker className="h-5 w-5" />,
                title: 'Sugar Syrup Calculator',
                body: 'Precise sugar and water amounts for 1:1, 3:2, or 2:1 syrup at any container size. Metric or imperial.',
              },
              {
                to: '/tools/brood-timeline',
                icon: <Bug className="h-5 w-5" />,
                title: 'Brood Development Timeline',
                body: 'Visualize queen, worker, and drone brood stages with day counts and project dates from any starting day.',
              },
              {
                to: '/tools/swarm-management',
                icon: <Waypoints className="h-5 w-5" />,
                title: 'Swarm Management',
                body: 'Step-by-step Demaree swarm-control workflow with follow-up timing and an inspection planner.',
              },
            ].map(tool => (
              <Link
                key={tool.to}
                to={tool.to}
                className="group relative flex flex-col bg-[#F4ECDB] p-8 transition-colors hover:bg-[#FBF5EA]"
              >
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-stone-900/5 text-stone-900 transition-colors group-hover:bg-amber-400 group-hover:text-stone-950">
                    {tool.icon}
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-stone-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-stone-900" />
                </div>
                <h3
                  className="mt-6 text-lg font-semibold text-stone-900"
                  style={sans}
                >
                  {tool.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">
                  {tool.body}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative overflow-hidden bg-[#FBF5EA] py-24 sm:py-32">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.05]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='56' height='64' viewBox='0 0 56 64'><path d='M28 2l24 14v32L28 62 4 48V16L28 2z' fill='none' stroke='%23292524' stroke-width='1'/></svg>\")",
            backgroundSize: '56px 64px',
          }}
        />
        <div className="relative mx-auto max-w-4xl px-6 text-center">
          <img
            src="/hive-pal-logo.png"
            alt=""
            aria-hidden="true"
            className="mx-auto h-14 w-14 opacity-90"
          />
          <h2
            className="mt-8 text-4xl leading-[1.05] tracking-tight text-stone-900 sm:text-6xl"
            style={{ ...display, fontVariationSettings: "'opsz' 96, 'wdth' 100, 'wght' 500" }}
          >
            Give it a{' '}
            <span className="text-amber-700" style={display}>
              try
            </span>
            .
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-stone-600">
            Sign up for the hosted version, or grab the source and run it
            yourself. Either way, it's free.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
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
              className="border-stone-900/20 bg-transparent px-6 text-stone-900 hover:bg-stone-900 hover:text-amber-50"
              asChild
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

      {/* Footer */}
      <footer className="bg-[#15201E] text-amber-50/80">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            <div className="col-span-2 sm:col-span-1">
              <Link to="/" className="flex items-center gap-3">
                <img
                  src="/hive-pal-logo.png"
                  alt="Hive Pal"
                  className="h-9 w-9"
                />
                <span
                  className="text-lg font-semibold text-amber-50"
                  style={sans}
                >
                  Hive Pal
                </span>
              </Link>
              <p
                className="mt-5 max-w-xs text-sm leading-relaxed text-amber-50/65"
                style={sans}
              >
                Free, open-source beekeeping management. Making the craft
                simpler, more productive, and a little more enjoyable.
              </p>
            </div>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
                style={sans}
              >
                Tools
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <Link
                    to="/tools/syrup-calculator"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Syrup Calculator
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tools/brood-timeline"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Brood Timeline
                  </Link>
                </li>
                <li>
                  <Link
                    to="/tools/swarm-management"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Swarm Management
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
                style={sans}
              >
                Project
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="https://docs.hivepal.app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Documentation
                  </a>
                </li>
                <li>
                  <Link
                    to="/releases"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Release notes
                  </Link>
                </li>
                <li>
                  <a
                    href="https://github.com/martinhrvn/hive-pal/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Report an issue
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <p
                className="text-[11px] uppercase tracking-[0.22em] text-amber-200/60"
                style={sans}
              >
                Source
              </p>
              <ul className="mt-4 space-y-2.5 text-sm">
                <li>
                  <a
                    href="https://github.com/martinhrvn/hive-pal"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-amber-50/75 hover:text-amber-50"
                  >
                    <Github className="h-4 w-4" />
                    GitHub
                  </a>
                </li>
                <li>
                  <Link
                    to="/login"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link
                    to="/register"
                    className="text-amber-50/75 hover:text-amber-50"
                  >
                    Create account
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-amber-50/10 pt-8 sm:flex-row">
            <p
              className="text-[11px] uppercase tracking-[0.22em] text-amber-50/55"
              style={sans}
            >
              © 2025 Hive Pal · MIT Licensed
            </p>
            <p className="text-xs text-amber-50/55">
              Built with care for beekeepers everywhere.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
