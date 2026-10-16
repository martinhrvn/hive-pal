import React, { type ReactNode } from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import CodeBlock from '@theme/CodeBlock';
import {
  ArrowRight,
  ArrowUpRight,
  Boxes,
  ClipboardCheck,
  Compass,
  Database,
  Server,
  Wrench,
} from 'lucide-react';
import { GithubIcon } from '@site/src/components/GithubIcon';

import styles from './index.module.css';

type GuideLink = { label: string; to: string };
type GuideGroup = { title: string; icon: ReactNode; links: GuideLink[] };

// Mirrors the sidebar categories in sidebars.ts.
const GUIDE_GROUPS: GuideGroup[] = [
  {
    title: 'Getting around',
    icon: <Compass size={20} strokeWidth={1.75} />,
    links: [
      { label: 'Apiaries', to: '/docs/user-guide/apiaries' },
      { label: 'Hives', to: '/docs/user-guide/hives' },
      { label: 'Quick actions button', to: '/docs/user-guide/fab-actions' },
    ],
  },
  {
    title: 'Inspections',
    icon: <ClipboardCheck size={20} strokeWidth={1.75} />,
    links: [
      { label: 'Recording an inspection', to: '/docs/user-guide/inspections' },
      { label: 'Quick check', to: '/docs/user-guide/quick-check' },
      { label: 'Batch inspections', to: '/docs/user-guide/batch-inspections' },
      { label: 'Scheduled inspections', to: '/docs/user-guide/scheduled-inspections' },
      { label: 'Voice notes and AI', to: '/docs/user-guide/audio-ai' },
      { label: 'Bulk add', to: '/docs/user-guide/bulk-add' },
    ],
  },
  {
    title: 'Colony management',
    icon: <Boxes size={20} strokeWidth={1.75} />,
    links: [
      { label: 'Queens', to: '/docs/user-guide/queens' },
      { label: 'Equipment', to: '/docs/user-guide/equipment' },
      { label: 'Harvests', to: '/docs/user-guide/harvest' },
      { label: 'Weather', to: '/docs/user-guide/weather' },
    ],
  },
  {
    title: 'Data and devices',
    icon: <Database size={20} strokeWidth={1.75} />,
    links: [
      { label: 'QR codes', to: '/docs/user-guide/qr-codes' },
      { label: 'Import and export', to: '/docs/user-guide/import-export' },
      { label: 'Calendar', to: '/docs/user-guide/calendar' },
      { label: 'Reports', to: '/docs/user-guide/reports' },
      { label: 'Apiary assistant', to: '/docs/user-guide/assistant' },
      { label: 'AI assistants (MCP)', to: '/docs/user-guide/mcp' },
      { label: 'HiveScale', to: '/docs/user-guide/hivescale' },
    ],
  },
  {
    title: 'Tools and account',
    icon: <Wrench size={20} strokeWidth={1.75} />,
    links: [
      { label: 'Free beekeeping tools', to: '/docs/user-guide/tools' },
      { label: 'Signing in', to: '/docs/user-guide/login' },
      { label: 'Account and settings', to: '/docs/user-guide/account-settings' },
      { label: 'Sending feedback', to: '/docs/user-guide/feedback' },
    ],
  },
  {
    title: 'Self-hosting',
    icon: <Server size={20} strokeWidth={1.75} />,
    links: [
      { label: 'Requirements', to: '/docs/self-hosting/requirements' },
      { label: 'Docker setup', to: '/docs/self-hosting/docker-setup' },
      { label: 'Manual setup', to: '/docs/self-hosting/manual-setup' },
      { label: 'Configuration', to: '/docs/self-hosting/configuration' },
      { label: 'Backup and restore', to: '/docs/self-hosting/backup-restore' },
      { label: 'Monitoring', to: '/docs/self-hosting/monitoring' },
    ],
  },
];

const COMPOSE_SNIPPET = `# docker-compose.yaml: the app and a PostgreSQL database
services:
  app:
    image: ghcr.io/martinhrvn/hive-pal:latest
    ports: ['80:3000']
  postgres:
    image: postgres:14

$ docker compose up -d`;

function Hero() {
  return (
    <header className={styles.hero}>
      <div className={clsx('container', styles.heroGrid)}>
        <div className={styles.heroText}>
          <Heading as="h1" className={styles.heroTitle}>
            Learn Hive-Pal, from first hive to your own server.
          </Heading>
          <p className={styles.heroLede}>
            Guides for recording apiaries, hives and inspections, and for
            running Hive-Pal on hardware you control.
          </p>
          <div className={styles.heroCtas}>
            <Link className={clsx(styles.btn, styles.btnPrimary)} to="/docs/intro">
              Read the guide
              <ArrowRight size={18} strokeWidth={2} aria-hidden="true" />
            </Link>
            <Link className={clsx(styles.btn, styles.btnGhost)} to="/docs/installation">
              Self-host it
            </Link>
          </div>
        </div>
        <picture className={styles.heroMedia}>
          <source
            type="image/webp"
            srcSet="/img/hero-768.webp 768w, /img/hero-1280.webp 1280w"
            sizes="(min-width: 997px) 45vw, 100vw"
          />
          <img
            src="/img/hero-1280.webp"
            alt="Honey bees working across a capped frame"
            width={1280}
            height={904}
            fetchPriority="high"
            decoding="async"
          />
        </picture>
      </div>
    </header>
  );
}

function RunOptions() {
  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Two ways to run it
        </Heading>
        <div className={styles.runGrid}>
          <div className={styles.runHosted}>
            <Heading as="h3" className={styles.runTitle}>
              Use hivepal.app
            </Heading>
            <p>
              Sign up and start recording straight away. The hosted app runs
              the same open-source code, and you can export your data at any
              time.
            </p>
            <div className={styles.runLinks}>
              <Link to="https://hivepal.app">
                Open the app
                <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
              <Link to="/docs/getting-started/quickstart">
                Quick start walkthrough
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className={styles.runSelf}>
            <Heading as="h3" className={styles.runTitle}>
              Run it yourself
            </Heading>
            <p>
              One Docker image with the API and web app, plus a PostgreSQL
              database. Two containers, one compose file.
            </p>
            <CodeBlock
              language="yaml"
              className={styles.runCode}
              children={COMPOSE_SNIPPET}
            />
            <div className={styles.runLinks}>
              <Link to="/docs/installation">
                Full installation guide
                <ArrowRight size={16} strokeWidth={2} aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function GuideDirectory() {
  return (
    <section className={clsx(styles.section, styles.sectionTight)}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Find a guide
        </Heading>
        <div className={styles.guideGrid}>
          {GUIDE_GROUPS.map((group) => (
            <nav key={group.title} className={styles.guideGroup} aria-label={group.title}>
              <div className={styles.guideHeading}>
                <span className={styles.guideIcon}>{group.icon}</span>
                <Heading as="h3" className={styles.guideTitle}>
                  {group.title}
                </Heading>
              </div>
              <ul className={styles.guideList}>
                {group.links.map((link) => (
                  <li key={link.to}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>
    </section>
  );
}

function OpenSource() {
  return (
    <section className={styles.openSource}>
      <div className={clsx('container', styles.openSourceGrid)}>
        <div>
          <Heading as="h2" className={styles.sectionTitle}>
            Open source, MIT licensed.
          </Heading>
          <p className={styles.openSourceBody}>
            Hive-Pal is built in the open by beekeepers. Bug reports, fixes and
            corrections to these pages are all welcome.
          </p>
        </div>
        <ul className={styles.openSourceLinks}>
          <li>
            <Link to="https://github.com/martinhrvn/hive-pal">
              <GithubIcon width={18} height={18} />
              Browse the source
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link to="https://github.com/martinhrvn/hive-pal/issues">
              Report an issue
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
          <li>
            <Link to="https://github.com/martinhrvn/hive-pal/tree/main/docs">
              Improve these docs
              <ArrowUpRight size={16} strokeWidth={2} aria-hidden="true" />
            </Link>
          </li>
        </ul>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Layout
      title="Hive-Pal Documentation"
      description="Guides for Hive-Pal, the open-source beekeeping app: apiaries, hives, inspections, queens, harvests, and self-hosting with Docker."
    >
      <Hero />
      <main>
        <RunOptions />
        <GuideDirectory />
        <OpenSource />
      </main>
    </Layout>
  );
}
