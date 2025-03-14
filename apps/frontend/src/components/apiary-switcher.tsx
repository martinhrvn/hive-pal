import { ChevronsUpDown, HomeIcon, Plus } from 'lucide-react';

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
import { ApiaryResponseDto, useApiariesControllerFindAll } from 'api-client';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useIsAdmin } from '@/hooks/use-is-admin.ts';

const APIARY_SELECTION = 'hive_pal_apiary_selection';

export function ApiarySwitcher() {
  const { isMobile } = useSidebar();
  const isAdmin = useIsAdmin();

  const navigate = useNavigate();
  const { data: apiaries } = useApiariesControllerFindAll({
    query: { select: data => data.data },
  });
  if (
    apiaries?.length === 0 &&
    window.location.pathname !== '/apiaries/create' &&
    !isAdmin
  ) {
    navigate('/apiaries/create');
  }
  const selectedApiaryId = useMemo(() => {
    const apiaryFromLocalStorage = localStorage.getItem(APIARY_SELECTION);
    try {
      const apiary: string | null = apiaryFromLocalStorage;
      return apiary;
    } catch {
      return null;
    }
  }, []);

  const [activeApiaryId, setActiveApiaryId] = useState(
    selectedApiaryId ?? null,
  );

  const activeApiary = useMemo(() => {
    const apiary = apiaries?.find(apiary => apiary.id === activeApiaryId);
    if (!apiary) {
      const firstApiary = apiaries?.[0];
      if (firstApiary) {
        setActiveApiaryId(firstApiary.id);
        localStorage.setItem(APIARY_SELECTION, firstApiary.id);
        return firstApiary;
      }
    }
    return apiary;
  }, [apiaries, activeApiaryId]);

  const handleSetActiveApiary = (apiary: ApiaryResponseDto) => {
    setActiveApiaryId(apiary.id);
    localStorage.setItem(APIARY_SELECTION, apiary.id);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                <HomeIcon />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {activeApiary?.name}
                </span>
                <span className="truncate text-xs">
                  {activeApiary?.location}
                </span>
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
              Teams
            </DropdownMenuLabel>
            {apiaries?.map((apiary, index) => (
              <DropdownMenuItem
                key={apiary.name}
                onClick={() => handleSetActiveApiary(apiary)}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-xs border">
                  <HomeIcon className="size-4" />
                </div>
                {apiary.name}
                <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
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
                Add apiary
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
