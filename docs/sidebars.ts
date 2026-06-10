import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'installation',
    {
      type: 'category',
      label: 'Getting Started',
      items: ['getting-started/quickstart'],
    },
    {
      type: 'category',
      label: 'User Guide',
      link: { type: 'doc', id: 'user-guide/overview' },
      items: [
        {
          type: 'category',
          label: 'Getting Around',
          items: [
            'user-guide/apiaries',
            'user-guide/hives',
            'user-guide/fab-actions',
          ],
        },
        {
          type: 'category',
          label: 'Inspections',
          items: [
            'user-guide/inspections',
            'user-guide/quick-check',
            'user-guide/batch-inspections',
            'user-guide/scheduled-inspections',
            'user-guide/audio-ai',
            'user-guide/bulk-add',
          ],
        },
        {
          type: 'category',
          label: 'Colony Management',
          items: [
            'user-guide/queens',
            'user-guide/equipment',
            'user-guide/harvest',
            'user-guide/weather',
          ],
        },
        {
          type: 'category',
          label: 'Data & Devices',
          items: [
            'user-guide/qr-codes',
            'user-guide/import-export',
            'user-guide/calendar',
            'user-guide/reports',
            'user-guide/assistant',
            'user-guide/hivescale',
          ],
        },
        {
          type: 'category',
          label: 'Tools & Account',
          items: [
            'user-guide/tools',
            'user-guide/login',
            'user-guide/account-settings',
            'user-guide/feedback',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Self-Hosting',
      items: [
        'self-hosting/requirements',
        'self-hosting/docker-setup',
        'self-hosting/manual-setup',
        'self-hosting/configuration',
        'self-hosting/backup-restore',
        'self-hosting/monitoring',
      ],
    },
    'troubleshooting',
  ],
};

export default sidebars;
