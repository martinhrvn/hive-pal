import { useTranslation } from 'react-i18next';
import {
  ArrowLeftRight,
  HomeIcon,
  Pencil,
  Plus,
  Repeat,
  Trash2,
} from 'lucide-react';
import type { QueenDetail } from 'shared-schemas';
import {
  ActionSidebarContainer,
  ActionSidebarGroup,
  MenuItemButton,
  MenuItemLink,
} from '@/components/sidebar';

export type QueenActionHandlers = {
  onTransfer: () => void;
  onDelete: () => void;
};

/**
 * Right-hand actions, like the hive page's sidebar. Viewers only get the
 * link to her hive; `handlers` is omitted for them.
 */
export const QueenActionSidebar = ({
  queen,
  handlers,
}: {
  queen: QueenDetail;
  handlers?: QueenActionHandlers;
}) => {
  const { t } = useTranslation(['queen', 'common']);
  if (!handlers && !queen.hiveId) return null;

  return (
    <ActionSidebarContainer>
      <ActionSidebarGroup title={t('actions.title')}>
        {queen.hiveId && (
          <MenuItemLink
            to={`/hives/${queen.hiveId}`}
            icon={<HomeIcon />}
            label={t('actions.viewHive')}
          />
        )}
        {handlers && (
          <>
            <MenuItemButton
              icon={<ArrowLeftRight />}
              label={t('actions.transferQueen')}
              onClick={handlers.onTransfer}
            />
            <MenuItemLink
              to={`/queens/create?motherQueenId=${queen.id}`}
              icon={<Plus />}
              label={t('detail.addDaughter')}
            />
            {queen.hiveId && (
              <MenuItemLink
                to={`/hives/${queen.hiveId}/queens/create`}
                icon={<Repeat />}
                label={t('actions.replaceQueen')}
              />
            )}
          </>
        )}
      </ActionSidebarGroup>

      {handlers && (
        <ActionSidebarGroup title={t('actions.manageQueen')}>
          <MenuItemLink
            to={`/queens/${queen.id}/edit`}
            icon={<Pencil />}
            label={t('actions.editQueen')}
          />
          <MenuItemButton
            icon={<Trash2 />}
            label={t('actions.deleteQueen')}
            onClick={handlers.onDelete}
            className="text-destructive hover:text-destructive"
          />
        </ActionSidebarGroup>
      )}
    </ActionSidebarContainer>
  );
};
