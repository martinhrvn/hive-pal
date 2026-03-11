import { format } from 'date-fns';
import { ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type InspectionHeaderProps = {
  hiveName: string;
  hiveId: string;
  date: string;
};

export const InspectionHeader = ({
  hiveName,
  hiveId,
  date,
}: InspectionHeaderProps) => {
  const { t } = useTranslation('inspection');
  return (
    <div className="p-4 mb-4">
      <div className="flex flex-col justify-between items-start gap-2">
        <div>
          <h3 className="font-medium flex gap-5">
            {hiveName}
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
