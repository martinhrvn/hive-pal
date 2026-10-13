import { useTranslation } from 'react-i18next';
import { HiveResponse } from 'shared-schemas';
import { StatusPill } from '@/components/common/status-pill';
import { getStatusTone, hiveStatusLabelKey } from '@/utils/status-colors';

type HiveStatusProps = {
  status?: HiveResponse['status'];
};

export const HiveStatus = ({ status }: HiveStatusProps) => {
  const { t } = useTranslation('hive');
  if (!status) {
    return null;
  }
  return (
    <StatusPill tone={getStatusTone(status)} size="sm">
      {t(hiveStatusLabelKey(status))}
    </StatusPill>
  );
};
