import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertCircle, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { usePendingBoxUpdatesStore } from '@/stores/pendingBoxUpdatesStore';
import { validatePayloadFreshness, StalePayloadError } from '@/utils/boxUpdateValidation';
import { useUpdateHiveBoxes } from '@/api/hooks/useHives';
import type { UpdateHiveBoxes } from 'shared-schemas';
import { toast } from 'sonner';

interface PendingBoxUpdateBannerProps {
  inspectionId: string;
}

/**
 * Warning banner component displayed when a box update is pending.
 *
 * States:
 * - in-progress: Shows loading spinner with message
 * - failed: Shows error alert with retry button (up to 5 attempts)
 *
 * Handles:
 * - Retrying with staleness validation
 * - Calling the actual box update mutation
 * - Disabling retry if payload is stale or max retries reached
 * - Dismissing the banner
 */
export const PendingBoxUpdateBanner: React.FC<
  PendingBoxUpdateBannerProps
> = ({ inspectionId }) => {
  const { t } = useTranslation('inspection');
  const retryTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const [isRetrying, setIsRetrying] = useState(false);

  // Store mutations
  const getPendingUpdate = usePendingBoxUpdatesStore(
    (state) => state.getPendingUpdate
  );
  const updateStatus = usePendingBoxUpdatesStore((state) => state.updateStatus);
  const incrementRetryCount = usePendingBoxUpdatesStore(
    (state) => state.incrementRetryCount
  );
  const removePendingUpdate = usePendingBoxUpdatesStore(
    (state) => state.removePendingUpdate
  );

  // API mutation for box update
  const { mutateAsync: updateHiveBoxes } = useUpdateHiveBoxes();

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Handle retry click with staleness validation and actual mutation call.
   *
   * Flow:
   * 1. Validate payload freshness (compare timestamps)
   * 2. If stale, disable retry permanently
   * 3. If fresh, call updateHiveBoxes mutation
   * 4. On success, remove from store and show success toast
   * 5. On failure, update error message and increment retry count
   */
  const handleRetry = useCallback(async () => {
    // Rate limit: prevent multiple retries in quick succession
    if (isRetrying) return;

    // Get fresh pending update reference
    const currentPending = getPendingUpdate(inspectionId);
    if (!currentPending) return;

    setIsRetrying(true);

    try {
      // Validate payload freshness to prevent applying stale configurations
      await validatePayloadFreshness(currentPending);

      // Update status to "in-progress" to show loading state
      updateStatus(inspectionId, 'in-progress');

      // Actually perform the box update mutation
      await updateHiveBoxes({
        id: currentPending.hiveId,
        // The store types boxPayload minimally, but it holds full box configs.
        boxes: currentPending.boxPayload as unknown as UpdateHiveBoxes['boxes'],
      });

      // On success, remove pending update from store
      removePendingUpdate(inspectionId);
      toast.success(t('inspection:pendingBoxUpdate.retrySuccess'));
    } catch (error) {
      if (error instanceof StalePayloadError) {
        // Permanently disable retry for stale payloads
        updateStatus(inspectionId, 'failed', error.message);
        toast.error(t('inspection:pendingBoxUpdate.stalePayload'));
      } else {
        // Handle API/network errors - increment retry count only on actual API failure
        let errorMessage = t('inspection:pendingBoxUpdate.failedDescription');

        if (axios.isAxiosError(error) && error.response?.data?.message) {
          errorMessage = error.response.data.message;
        } else if (error instanceof Error) {
          errorMessage = error.message;
        }

        // Increment retry count and update error message
        incrementRetryCount(inspectionId);
        updateStatus(inspectionId, 'failed', errorMessage);
        toast.error(t('inspection:pendingBoxUpdate.retryFailed'));
      }
    } finally {
      // Apply 2-second debounce to prevent rapid successive retries
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      retryTimeoutRef.current = setTimeout(() => {
        setIsRetrying(false);
      }, 2000);
    }
  }, [
    inspectionId,
    isRetrying,
    getPendingUpdate,
    updateStatus,
    incrementRetryCount,
    removePendingUpdate,
    updateHiveBoxes,
    t,
  ]);

  /**
   * Handle dismiss click to remove pending update from store.
   */
  const handleDismiss = useCallback(() => {
    removePendingUpdate(inspectionId);
  }, [inspectionId, removePendingUpdate]);

  // Query pending update - use function reference to avoid stale closures
  const pendingUpdate = getPendingUpdate(inspectionId);

  // Early return if no pending update
  if (!pendingUpdate) {
    return null;
  }

  // Determine if retry is disabled (5 or more attempts)
  const isRetryDisabled = pendingUpdate.retryCount >= 5;

  // Check if error is due to staleness (permanent disable)
  const isStalenessError =
    pendingUpdate.error?.includes('changed since') ?? false;

  // In-progress loading state
  if (pendingUpdate.status === 'in-progress') {
    return (
      <Alert className="border-blue-200 bg-blue-50">
        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
        <AlertTitle className="text-blue-900">
          {t('inspection:pendingBoxUpdate.updatingTitle')}
        </AlertTitle>
        <AlertDescription className="text-blue-800">
          {t('inspection:pendingBoxUpdate.updatingDescription')}
        </AlertDescription>
      </Alert>
    );
  }

  // Failed state
  if (pendingUpdate.status === 'failed') {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>
          {t('inspection:pendingBoxUpdate.failedTitle')}
        </AlertTitle>
        <AlertDescription className="space-y-3">
          <div className="text-sm">
            {pendingUpdate.error ||
              t('inspection:pendingBoxUpdate.failedDescription')}
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleRetry}
              disabled={isRetryDisabled || isStalenessError || isRetrying}
            >
              {isRetrying && (
                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              )}
              {isRetryDisabled || isStalenessError
                ? t('inspection:pendingBoxUpdate.retryDisabled')
                : t('inspection:pendingBoxUpdate.retry')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDismiss}
            >
              <X className="mr-2 h-3 w-3" />
              {t('inspection:pendingBoxUpdate.dismiss')}
            </Button>
          </div>
          {(isRetryDisabled || isStalenessError) && (
            <div className="text-xs text-destructive-foreground/80">
              {isStalenessError
                ? t('inspection:pendingBoxUpdate.stalePayloadMessage')
                : t('inspection:pendingBoxUpdate.maxRetriesReached')}
            </div>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  // Fallback: should not reach here
  return null;
};
