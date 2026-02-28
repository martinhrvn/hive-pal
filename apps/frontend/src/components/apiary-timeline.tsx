import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInspections, useActions, useQuickChecks, useHives } from '@/api/hooks';
import { useApiary } from '@/hooks/use-apiary';
import { Section } from '@/components/common/section';
import { TimelineEventList } from '@/components/common/timeline-event-list';
import { QuickCheckDialog } from '@/pages/hive/hive-detail-page/quick-check-dialog';
import { InspectionResponse, ActionResponse } from 'shared-schemas';

export const ApiaryTimeline = () => {
  const navigate = useNavigate();
  const { activeApiaryId } = useApiary();

  const { data: inspections, isLoading: inspectionsLoading } = useInspections();
  const { data: actions, isLoading: actionsLoading } = useActions();
  const { data: quickChecks, isLoading: quickChecksLoading } = useQuickChecks(
    activeApiaryId ? { apiaryId: activeApiaryId } : undefined,
    { enabled: !!activeApiaryId },
  );
  const { data: hives } = useHives();

  const hiveList = useMemo(
    () => hives?.map(h => ({ id: h.id, name: h.name })) ?? [],
    [hives],
  );

  const getHiveName = useCallback(
    (hiveId: string) => hives?.find(h => h.id === hiveId)?.name,
    [hives],
  );

  const handleInspectionClick = useCallback(
    (inspection: InspectionResponse) => {
      navigate(`/inspections/${inspection.id}`);
    },
    [navigate],
  );

  const handleActionClick = useCallback(
    (action: ActionResponse) => {
      if (action.harvestId) {
        navigate(`/harvests/${action.harvestId}`);
      } else if (action.hiveId) {
        navigate(`/hives/${action.hiveId}`);
      }
    },
    [navigate],
  );

  return (
    <Section title="Recent Activity">
      <TimelineEventList
        inspections={inspections ?? []}
        actions={actions ?? []}
        quickChecks={quickChecks ?? []}
        isLoading={inspectionsLoading || actionsLoading || quickChecksLoading}
        emptyMessage="No activity recorded in this apiary yet"
        getHiveName={getHiveName}
        hives={hiveList}
        onInspectionClick={handleInspectionClick}
        onActionClick={handleActionClick}
        headerSlot={
          activeApiaryId ? (
            <QuickCheckDialog
              apiaryId={activeApiaryId}
              triggerVariant="inline"
            />
          ) : undefined
        }
      />
    </Section>
  );
};
