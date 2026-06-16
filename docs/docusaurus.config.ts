import {themes as prismThemes} from 'prism-react-renderer';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

const config: Config = {
  title: 'Hive-Pal',
  tagline: 'Modern beekeeping management for everyone',
  favicon: 'img/favicon.ico',
  url: 'https://docs.hivepal.app',
  baseUrl: '/',
  organizationName: 'martinhrvn',
  projectName: 'hive-pal',
  trailingSlash: false,
  deploymentBranch: 'gh-pages', // The branch to deploy to

  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  headTags: [
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Hive-Pal Documentation',
        url: 'https://docs.hivepal.app',
        description:
          'Documentation for Hive-Pal, an open-source beekeeping management application.',
        publisher: {
          '@type': 'Organization',
          name: 'Hive-Pal',
        },
      }),
    },
    {
      tagName: 'script',
      attributes: {
        type: 'application/ld+json',
      },
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        name: 'Hive-Pal',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, Docker',
        description:
          'Open-source, self-hostable beekeeping management application for tracking apiaries, hives, inspections, queens, harvests, and HiveScale telemetry.',
        url: 'https://hivepal.app',
        license: 'https://opensource.org/licenses/MIT',
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      }),
    },
  ],

  plugins: [
    [
      'docusaurus-plugin-llms',
      {
        title: 'Hive-Pal Documentation',
        description:
          'Documentation for Hive-Pal, an open-source, self-hostable beekeeping management application.',
        generateLLMsTxt: true,
        generateLLMsFullTxt: true,
        includeOrder: ['intro', 'installation', 'getting-started/*', 'user-guide/*', 'self-hosting/*', 'troubleshooting'],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl:
            'https://github.com/martinhrvn/hive-pal/tree/main/docs/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
        sitemap: {
          changefreq: 'weekly' as const,
          priority: 0.5,
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    // Hive-Pal social card
    image: 'img/hive-pal-social-card.jpg',
    metadata: [
      {
        name: 'keywords',
        content:
          'beekeeping, hive management, apiary, bee colony, inspection tracking, open source',
      },
      {name: 'og:type', content: 'website'},
      {name: 'og:site_name', content: 'Hive-Pal Documentation'},
      {name: 'twitter:card', content: 'summary_large_image'},
    ],
    navbar: {
      title: 'Hive-Pal',
      logo: {
        alt: 'Hive-Pal Logo',
        src: 'img/hive-pal-logo.png',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          href: 'https://hivepal.app',
          label: 'Open App',
          position: 'right',
        },
        {
          href: 'https://github.com/martinhrvn/hive-pal',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Documentation',
          items: [
            {
              label: 'Introduction',
              to: '/docs/intro',
            },
            {
              label: 'Installation',
              to: '/docs/installation',
            },
            {
              label: 'User Guide',
              to: '/docs/user-guide/overview',
            },
          ],
        },
        {
          title: 'Project',
          items: [
            {
              label: 'Hive-Pal App',
              href: 'https://hivepal.app',
            },
            {
              label: 'Free Tools',
              href: 'https://hivepal.app/tools',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/martinhrvn/hive-pal',
            },
            {
              label: 'Issues',
              href: 'https://github.com/martinhrvn/hive-pal/issues',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Hive-Pal. Built with Docusaurus.`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
