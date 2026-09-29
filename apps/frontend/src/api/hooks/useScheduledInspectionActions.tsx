import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUpdateInspection } from './useInspections';
import { useHiveApiaryLookup } from './useHives';
import { InspectionResponse, InspectionStatus } from 'shared-schemas';
import { RescheduleDialog } from '@/pages/inspection/components/reschedule-dialog';
import { toInspectionDateISOString } from '@/utils/inspection-date';

/**
 * Encapsulates the repeated "do inspection / reschedule" action logic used
 * in the apiary header, inspection status summary, and timeline event list.
 */
export const useScheduledInspectionActions = (
  getHiveName: (hiveId: string) => string,
) => {
  const navigate = useNavigate();
  const [reschedulingInspection, setReschedulingInspection] =
    useState<InspectionResponse | null>(null);
  const { mutate: updateInspection } = useUpdateInspection();
  const lookupApiaryId = useHiveApiaryLookup();

  const handleDoInspection = (inspection: InspectionResponse) => {
    navigate(`/inspections/${inspection.id}/edit?from=scheduled`);
  };

  const handleReschedule = (newDate: Date, isAllDay: boolean) => {
    if (!reschedulingInspection) return;
    updateInspection(
      {
        id: reschedulingInspection.id,
        data: {
          date: toInspectionDateISOString(newDate, isAllDay),
          isAllDay,
          status: InspectionStatus.SCHEDULED,
        },
        apiaryId: lookupApiaryId(reschedulingInspection.hiveId),
      },
      { onSuccess: () => setReschedulingInspection(null) },
    );
  };

  const rescheduleDialogElement = reschedulingInspection ? (
    <RescheduleDialog
      open={!!reschedulingInspection}
      onOpenChange={open => !open && setReschedulingInspection(null)}
      inspection={reschedulingInspection}
      hiveName={getHiveName(reschedulingInspection.hiveId)}
      onReschedule={handleReschedule}
    />
  ) : null;

  return {
    reschedulingInspection,
    setReschedulingInspection,
    handleDoInspection,
    rescheduleDialogElement,
  };
};
