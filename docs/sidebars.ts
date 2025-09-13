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
      items: [
        'user-guide/overview',
        'user-guide/apiaries',
        'user-guide/hives',
        'user-guide/inspections',
        'user-guide/queens',
        'user-guide/harvest',
        'user-guide/equipment',
        'user-guide/weather',
        'user-guide/fab-actions',
        'user-guide/feedback',
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
