import * as React from 'react';
import {
  AudioWaveform,
  Command,
  HomeIcon,
  PieChart,
  Settings2,
} from 'lucide-react';

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
  apiaries: [
    {
      name: 'Default',
      logo: HomeIcon,
      plan: 'Location',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: Command,
      plan: 'Free',
    },
  ],
  navMain: [
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
        <ApiarySwitcher teams={data.apiaries} />
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
