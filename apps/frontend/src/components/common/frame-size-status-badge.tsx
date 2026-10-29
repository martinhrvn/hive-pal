import { useTranslation } from 'react-i18next';
import { FrameSize, FrameSizeStatus } from 'shared-schemas';
import { StatusPill, type StatusTone } from '@/components/common/status-pill';

const STATUS_PRESENTATION: Record<
  FrameSize['status'],
  { tone: StatusTone; labelKey: string }
> = {
  [FrameSizeStatus.APPROVED]: {
    tone: 'success',
    labelKey: 'frameSizes.statusShared',
  },
  [FrameSizeStatus.PENDING]: {
    tone: 'warning',
    labelKey: 'frameSizes.statusPending',
  },
  [FrameSizeStatus.REJECTED]: {
    tone: 'danger',
    labelKey: 'frameSizes.statusRejected',
  },
};

/** Translated review state of a frame size, tinted like the other status pills. */
export const FrameSizeStatusBadge = ({
  status,
}: {
  status: FrameSize['status'];
}) => {
  const { t } = useTranslation('common');
  const { tone, labelKey } = STATUS_PRESENTATION[status];

  return (
    <StatusPill tone={tone} size="sm">
      {t(labelKey)}
    </StatusPill>
  );
};
