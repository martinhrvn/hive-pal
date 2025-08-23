import * as React from 'react';
import { HomeIcon, PieChart, Settings2, MapPin, Droplets } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NavMain } from '@/components/nav-main';
import { NavHives } from '@/components/nav-hives.tsx';
import { NavUser } from '@/components/nav-user';
import { NavAdmin } from '@/components/nav-admin';
import { ApiarySwitcher } from '@/components/apiary-switcher.tsx';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';

// Navigation data factory function
const getNavData = (t: (key: string) => string) => ({
  navMain: [
    {
      title: t('navigation.apiaries'),
      url: '/apiaries',
      icon: MapPin,
      isActive: true,
      items: [
        {
          title: t('navigation.allApiaries'),
          url: '/apiaries',
        },
        {
          title: t('navigation.createApiary'),
          url: '/apiaries/create',
        },
      ],
    },
    {
      title: t('navigation.hives'),
      url: '/hives',
      icon: HomeIcon,
      isActive: true,
      items: [
        {
          title: t('navigation.allHives'),
          url: '/hives',
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
          title: t('navigation.allInspections'),
          url: '/inspections',
        },
        {
          title: t('navigation.schedule'),
          url: '/inspections/schedule',
        },
        {
          title: t('navigation.recent'),
          url: '/inspections/list/recent',
        },
        {
          title: t('navigation.upcoming'),
          url: '/inspections/list/upcoming',
        },
      ],
    },
    {
      title: t('navigation.harvests'),
      url: '/harvests',
      icon: Droplets,
      isActive: true,
      items: [
        {
          title: t('navigation.allHarvests'),
          url: '/harvests',
        },
      ],
    },
    {
      title: t('navigation.settings'),
      url: '/settings',
      icon: Settings2,
      items: [
        {
          title: t('navigation.general'),
          url: '/settings',
        },
      ],
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
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
