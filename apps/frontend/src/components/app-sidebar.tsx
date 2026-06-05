import * as React from 'react';
import type { TFunction } from 'i18next';
import {
  HomeIcon,
  PieChart,
  Settings2,
  MapPin,
  Droplets,
  Package,
  Layers,
  Calendar,
  BarChart3,
  MessageSquare,
  Crown,
  FolderOpen,
  Wrench,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NavMain } from '@/components/nav-main';
import { NavHives } from '@/components/nav-hives.tsx';
import { NavUser } from '@/components/nav-user';
import { NavAdmin } from '@/components/nav-admin';
import { LanguageSwitcher } from '@/components/language-switcher';
import { ApiarySwitcher } from '@/components/apiary-switcher.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// Navigation data factory function
const getNavData = (t: TFunction<'common'>) => ({
  navMain: [
    {
      title: t('navigation.apiaries', { defaultValue: 'Apiaries' }),
      url: '/apiaries',
      icon: MapPin,
      isActive: true,
      items: [
        {
          title: t('navigation.allApiaries', { defaultValue: 'All Apiaries' }),
          url: '/apiaries',
        },
        {
          title: t('navigation.createApiary', { defaultValue: 'Create Apiary' }),
          url: '/apiaries/create',
        },
      ],
    },
    {
      title: t('navigation.hives', { defaultValue: 'Hives' }),
      url: '/hives',
      icon: HomeIcon,
      isActive: true,
      items: [
        {
          title: t('navigation.allHives', { defaultValue: 'All Hives' }),
          url: '/hives',
        },
      ],
    },
    {
      title: t('navigation.queens'),
      url: '/queens',
      icon: Crown,
      isActive: true,
      items: [
        {
          title: t('navigation.allQueens'),
          url: '/queens',
        },
      ],
    },
    {
      title: t('navigation.inspections'),
      url: '/inspections',
      icon: PieChart,
      isActive: true,
      items: [
        {
          title: t('navigation.allInspections', {
            defaultValue: 'All Inspections',
          }),
          url: '/inspections',
        },
        {
          title: t('navigation.schedule', { defaultValue: 'Schedule' }),
          url: '/inspections/schedule',
        },
        {
          title: 'Batch Inspections',
          url: '/batch-inspections',
        },
        {
          title: t('navigation.recent', { defaultValue: 'Recent' }),
          url: '/inspections/list/recent',
        },
        {
          title: t('navigation.upcoming', { defaultValue: 'Upcoming' }),
          url: '/inspections/list/upcoming',
        },
      ],
    },
    {
      title: t('navigation.calendar', { defaultValue: 'Calendar' }),
      url: '/calendar',
      icon: Calendar,
      isActive: true,
    },
    {
      title: t('navigation.harvests', { defaultValue: 'Harvests' }),
      url: '/harvests',
      icon: Droplets,
      isActive: true,
    },
    {
      title: t('navigation.reports', { defaultValue: 'Reports' }),
      url: '/reports',
      icon: BarChart3,
      isActive: true,
    },
    {
      title: t('navigation.actions', { defaultValue: 'Bulk Add' }),
      url: '/actions/bulk',
      icon: Layers,
      isActive: true,
    },
    {
      title: t('navigation.files', { defaultValue: 'Files' }),
      url: '/files',
      icon: FolderOpen,
    },
    {
      title: t('navigation.equipment', { defaultValue: 'Equipment' }),
      url: '/equipment',
      icon: Package,
    },
    {
      title: t('navigation.tools', { defaultValue: 'Tools' }),
      url: '/tools/syrup-calculator',
      icon: Wrench,
      items: [
        {
          title: t('navigation.syrupCalculator', {
            defaultValue: 'Syrup Calculator',
          }),
          url: '/tools/syrup-calculator',
        },
        {
          title: t('navigation.broodTimeline', {
            defaultValue: 'Brood Timeline',
          }),
          url: '/tools/brood-timeline',
        },
      ],
    },
    {
      title: t('navigation.settings', { defaultValue: 'Settings' }),
      url: '/settings',
      icon: Settings2,
    },
    {
      title: t('feedback.sendFeedback', { defaultValue: 'Send Feedback' }),
      url: 'https://github.com/martinhrvn/hive-pal/issues',
      icon: MessageSquare,
      external: true,
    },
  ],
});

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { t } = useTranslation('common');
  const data = getNavData(t);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <ApiarySwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavAdmin />
        <NavHives />
        <LanguageSwitcher />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
