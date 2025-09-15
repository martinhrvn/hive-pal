import { useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useReleaseNotes } from './use-release-notes';
import { NewReleaseToast } from '@/components/release-notes-notification';

export const useReleaseNotesNotification = () => {
  const navigate = useNavigate();
  const {
    loadReleaseNotes,
    dismissRelease,
    getLatestUndismissedRelease,
    isLoaded,
    isLoading,
  } = useReleaseNotes();

  const hasShownNotification = useRef(false);

  const showReleaseNotification = useCallback(() => {
    if (hasShownNotification.current || isLoading || !isLoaded) return;

    const latestRelease = getLatestUndismissedRelease();
    if (!latestRelease) return;

    hasShownNotification.current = true;

    toast.custom(
      t => (
        <NewReleaseToast
          version={latestRelease.version}
          onDismiss={() => {
            dismissRelease(latestRelease.version);
            toast.dismiss(t);
          }}
          onViewReleases={() => {
            navigate('/releases');
          }}
        />
      ),
      {
        duration: 10000, // Auto-dismiss after 10 seconds
        position: 'top-right',
      },
    );
  }, [
    isLoading,
    isLoaded,
    getLatestUndismissedRelease,
    dismissRelease,
    navigate,
  ]);

  useEffect(() => {
    loadReleaseNotes();
  }, [loadReleaseNotes]);

  useEffect(() => {
    if (isLoaded && !isLoading) {
      // Small delay to ensure the app is fully loaded
      const timer = setTimeout(() => {
        showReleaseNotification();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [isLoaded, isLoading, showReleaseNotification]);

  return {
    showReleaseNotification,
    loadReleaseNotes,
    isLoaded,
    isLoading,
  };
};
