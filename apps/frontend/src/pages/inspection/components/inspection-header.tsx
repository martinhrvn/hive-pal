import { format } from 'date-fns';
import { ChevronRight, Map } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { HiveMinimap } from '@/components/hive-minimap';

type InspectionHeaderProps = {
  hiveName: string;
  hiveId: string;
  apiaryId?: string;
  date: string;
};

export const InspectionHeader = ({
  hiveName,
  hiveId,
  apiaryId,
  date,
}: InspectionHeaderProps) => {
  const { t } = useTranslation('inspection');
  return (
    <div className="p-4 mb-4">
      <div className="flex flex-col justify-between items-start gap-2">
        <div>
          <h3 className="font-medium flex items-center gap-3">
            {hiveName}
            {apiaryId && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50"
                    aria-label="Show apiary layout"
                    title="Show apiary layout"
                  >
                    <Map className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-auto max-w-[min(90vw,520px)] p-0"
                >
                  <HiveMinimap
                    apiaryId={apiaryId}
                    highlightedHiveId={hiveId}
                    showHeader={false}
                    className="border-0 shadow-none"
                  />
                </PopoverContent>
              </Popover>
            )}
            <a href={`/hives/${hiveId}`} className="flex items-center text-xs">
              {t('inspection:detail.viewHive')}
              <ChevronRight size={16} className="ml-1" />
            </a>
          </h3>
        </div>
        <div className="text-xs">{format(date, 'dd/MM/yyyy HH:mm')}</div>
      </div>
    </div>
  );
};
