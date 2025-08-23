import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';

interface NewReleaseToastProps {
  version: string;
  onDismiss: () => void;
  onViewReleases: () => void;
}

export function NewReleaseToast({
  version,
  onDismiss,
  onViewReleases,
}: NewReleaseToastProps) {
  const { t } = useTranslation('common');

  const handleViewReleases = () => {
    onViewReleases();
    onDismiss();
  };

  return (
    <div className="release-toast bg-white border border-gray-200 flex flex-col rounded-lg shadow-lg p-4">
      <div className="release-toast-content">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">
            🎉 {t('releaseNotes.newVersionAvailable', { version })}
          </p>
          <p className="text-sm text-gray-600">
            {t('releaseNotes.checkLatestFeatures')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleViewReleases}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 text-xs"
          >
            {t('releaseNotes.whatsNew')}
          </Button>
          <Button
            onClick={onDismiss}
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-gray-700 px-2 py-1 text-xs"
          >
            {t('releaseNotes.dismiss')}
          </Button>
        </div>
      </div>
    </div>
  );
}
