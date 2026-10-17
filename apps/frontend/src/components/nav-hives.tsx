import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  HomeIcon,
} from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useHives } from '@/api/hooks';

export function NavHives() {
  const { isMobile, setOpenMobile } = useSidebar();
  const navigate = useNavigate();
  const { data: hives } = useHives();
  const { t } = useTranslation('common');

  const handleNav = (url: string) => {
    if (isMobile) setOpenMobile(false);
    navigate(url);
  };

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{t('navigation.hives')}</SidebarGroupLabel>
      <SidebarMenu>
        {hives?.slice(0, 5)?.map(item => (
          <SidebarMenuItem key={item.id}>
            <SidebarMenuButton asChild>
              <Link
                to={`/hives/${item.id}`}
                onClick={() => {
                  if (isMobile) setOpenMobile(false);
                }}
                className="flex items-center"
              >
                <HomeIcon />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover>
                  <MoreHorizontal />
                  <span className="sr-only">{t('navigation.more')}</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg"
                side={isMobile ? 'bottom' : 'right'}
                align={isMobile ? 'end' : 'start'}
              >
                <DropdownMenuItem>
                  <Folder className="text-muted-foreground" />
                  <span>{t('navigation.viewProject')}</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Forward className="text-muted-foreground" />
                  <span>{t('navigation.shareProject')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Trash2 className="text-muted-foreground" />
                  <span>{t('navigation.deleteProject')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
        {hives && hives.length > 5 && (
          <SidebarMenuItem>
            <SidebarMenuButton
              className="text-sidebar-foreground/70"
              onClick={() => handleNav('/hives')}
            >
              <MoreHorizontal className="text-sidebar-foreground/70" />
              <span>{t('navigation.more')}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        )}
      </SidebarMenu>
    </SidebarGroup>
  );
}
