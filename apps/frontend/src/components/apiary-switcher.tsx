import { Check, ChevronsUpDown, HomeIcon, Layers, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useApiary } from '@/hooks/use-apiary';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ApiaryResponse } from 'shared-schemas';

export function ApiarySwitcher() {
  const { t } = useTranslation('apiary');
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const {
    activeApiary,
    setActiveApiaryId,
    setViewAllApiaries,
    viewAllApiaries,
    apiaries,
  } = useApiary();

  const queryClient = useQueryClient();

  // Select a single apiary: leave "view all" mode and refetch scoped data.
  const handleSetActiveApiary = (apiary: ApiaryResponse) => {
    setActiveApiaryId(apiary.id);
    setViewAllApiaries(false);
    queryClient.invalidateQueries();
  };

  // Turn on the cross-apiary "view all" mode.
  const handleSelectAll = () => {
    setViewAllApiaries(true);
    queryClient.invalidateQueries();
  };

  // Whether the trigger shows an "active" (filled) icon.
  const hasSelection = viewAllApiaries || !!activeApiary;

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              data-testid="apiary-switcher"
              className={`data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground ${!hasSelection ? 'border border-dashed border-muted-foreground/50' : ''}`}
            >
              <div
                className={`flex aspect-square size-8 items-center justify-center rounded-lg ${hasSelection ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'bg-muted text-muted-foreground'}`}
              >
                {viewAllApiaries ? <Layers /> : <HomeIcon />}
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                {viewAllApiaries ? (
                  <>
                    <span className="truncate font-medium">
                      {t('switcher.allApiaries')}
                    </span>
                    <span className="truncate text-xs">
                      {t('switcher.allApiariesSubtitle')}
                    </span>
                  </>
                ) : activeApiary ? (
                  <>
                    <span className="truncate font-medium">
                      {activeApiary.name}
                    </span>
                    <span className="truncate text-xs">
                      {activeApiary.location}
                    </span>
                  </>
                ) : (
                  <>
                    <span className="truncate font-medium text-muted-foreground">
                      {t('switcher.noApiarySelected')}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {t('switcher.selectOrCreate')}
                    </span>
                  </>
                )}
              </div>
              <ChevronsUpDown className="ml-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            align="start"
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-muted-foreground text-xs">
              {t('switcher.teams')}
            </DropdownMenuLabel>
            {/* Cross-apiary "view all" option — disables the single-apiary filter. */}
            <DropdownMenuItem
              onClick={handleSelectAll}
              data-testid="apiary-switcher-all"
              className="gap-2 p-2"
            >
              <div className="flex size-6 items-center justify-center rounded-xs border">
                <Layers className="size-4" />
              </div>
              {t('switcher.allApiaries')}
              {viewAllApiaries && <Check className="ml-auto size-4" />}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {apiaries?.map((apiary, index) => (
              <DropdownMenuItem
                key={apiary.id}
                onClick={() => handleSetActiveApiary(apiary)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <HomeIcon className="size-4" />
                </div>
                {apiary.name}
                {!viewAllApiaries && activeApiary?.id === apiary.id ? (
                  <Check className="ml-auto size-4" />
                ) : (
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                )}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="gap-2 p-2"
              onClick={() => {
                navigate('/apiaries/create');
              }}
            >
              <div className="bg-background flex size-6 items-center justify-center rounded-md border">
                <Plus className="size-4" />
              </div>
              <div className="text-muted-foreground font-medium">
                {t('switcher.addApiary')}
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
