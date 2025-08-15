import * as React from 'react';
import { HomeIcon, PieChart, Settings2, MapPin } from 'lucide-react';

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

// This is sample data.
const data = {
  navMain: [
    {
      title: 'Apiaries',
      url: '/apiaries',
      icon: MapPin,
      isActive: true,
      items: [
        {
          title: 'All Apiaries',
          url: '/apiaries',
        },
        {
          title: 'Create Apiary',
          url: '/apiaries/create',
        },
      ],
    },
    {
      title: 'Hives',
      url: '/hives',
      icon: HomeIcon,
      isActive: true,
      items: [
        {
          title: 'All Hives',
          url: '/hives',
        },
      ],
    },
    {
      title: 'Inspections',
      url: '/inspections',
      icon: PieChart,
      isActive: true,
      items: [
        {
          title: 'All',
          url: '/inspections',
        },
        {
          title: 'Schedule',
          url: '/inspections/schedule',
        },
        {
          title: 'Recent',
          url: '/inspections/list/recent',
        },
        {
          title: 'Upcoming',
          url: '/inspections/list/upcoming',
        },
      ],
    },
    {
      title: 'Settings',
      url: '/settings',
      icon: Settings2,
      items: [
        {
          title: 'General',
          url: '/settings',
        },
      ],
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
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
