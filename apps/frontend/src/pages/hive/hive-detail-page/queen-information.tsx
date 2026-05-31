import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card.tsx';
import { BeeIcon } from '@/components/common/bee-icon.tsx';
import { CalendarDays, MoreHorizontal } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { Button, buttonVariants } from '@/components/ui/button.tsx';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ActiveQueen, QueenResponse } from 'shared-schemas';
import { useState } from 'react';
import { QueenTransferDialog } from '@/pages/queen/components/queen-transfer-dialog';
import { getQueenColorClass } from '@/lib/queen-utils';
import { useUpdateQueen } from '@/api/hooks';

function formatInstalledDate(installedAt: string | Date): string {
  return format(
    typeof installedAt === 'string' ? parseISO(installedAt) : installedAt,
    'PPP',
  );
}

const QueenColorDot: React.FC<{ color?: string | null; size?: 'sm' | 'md' }> = ({
  color,
  size = 'sm',
}) => {
  const sizeClass = size === 'md' ? 'h-5 w-5' : 'h-4 w-4';
  return (
    <div
      className={`${sizeClass} rounded-full border border-gray-600 ${getQueenColorClass(color, 'bg-white')}`}
    />
  );
};

const QueenActionsMenu: React.FC<{
  queen: ActiveQueen;
  hiveId?: string;
  onTransferClick: () => void;
  onQueenUpdated?: () => void;
}> = ({ queen, hiveId, onTransferClick, onQueenUpdated }) => {
  const { t } = useTranslation('queen');
  const navigate = useNavigate();
  const { mutateAsync: updateQueen } = useUpdateQueen();

  const handleMarkQueenState = async (newState: 'DEAD' | 'REPLACED') => {
    await updateQueen({
      id: queen.id,
      data: {
        status: newState,
        replacedAt: new Date().toISOString(),
      },
    });
    onQueenUpdated?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 -my-1 text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100 hover:bg-stone-200/60 dark:hover:bg-stone-800/60"
          aria-label={t('actions.queenActions', { defaultValue: 'Queen actions' })}
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => navigate(`/queens/${queen.id}`)}>
          {t('actions.viewDetails')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={onTransferClick}>
          {t('actions.transferQueen')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/queens/${queen.id}/edit`)}>
          {t('actions.editQueen')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => navigate(`/hives/${hiveId}/queens/create`)}>
          {t('actions.replaceQueen')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMarkQueenState('DEAD')}>
          {t('actions.markAsDead')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleMarkQueenState('REPLACED')}>
          {t('actions.markAsLostMissing')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const AddQueenLink: React.FC<{
  hiveId?: string;
  variant?: 'default' | 'ghost';
}> = ({ hiveId, variant = 'ghost' }) => {
  const { t } = useTranslation('queen');
  return (
    <Link
      to={`/hives/${hiveId}/queens/create`}
      className={buttonVariants({ size: 'sm', variant })}
    >
      <BeeIcon className="mr-2 h-4 w-4" /> {t('actions.addQueen')}
    </Link>
  );
};

const NoActiveQueenPrompt: React.FC<{
  hiveId?: string;
  layout?: 'inline' | 'centered';
}> = ({ hiveId, layout = 'inline' }) => {
  const { t } = useTranslation('queen');

  if (layout === 'centered') {
    return (
      <div className="text-center py-2">
        <p className="text-muted-foreground mb-4">
          {t('information.noActiveQueen')}
        </p>
        <AddQueenLink hiveId={hiveId} variant="default" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {t('information.noActiveQueen')}
      </span>
      <AddQueenLink hiveId={hiveId} />
    </div>
  );
};

const QueenMobileView: React.FC<{
  activeQueen?: ActiveQueen | null;
  hiveId?: string;
  asLink?: boolean;
  onTransferClick: () => void;
  onQueenUpdated?: () => void;
}> = ({ activeQueen, hiveId, asLink = false, onTransferClick, onQueenUpdated }) => (
  <div className="sm:hidden">
    {activeQueen ? (
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Queen:</span>
          <QueenColorDot color={activeQueen.color} />
          {asLink ? (
            <Link to={`/queens/${activeQueen.id}`} className="text-sm font-medium hover:underline">
              {activeQueen.marking} • {activeQueen.year}
            </Link>
          ) : (
            <span className="text-sm font-medium">
              {activeQueen.marking} • {activeQueen.year}
            </span>
          )}
          {activeQueen.installedAt && (
            <span className="text-xs text-muted-foreground">
              {formatInstalledDate(activeQueen.installedAt)}
            </span>
          )}
        </div>
        <QueenActionsMenu
          queen={activeQueen}
          hiveId={hiveId}
          onTransferClick={onTransferClick}
          onQueenUpdated={onQueenUpdated}
        />
      </div>
    ) : (
      <NoActiveQueenPrompt hiveId={hiveId} />
    )}
  </div>
);

type QueenInformationProps = {
  hiveId?: string;
  activeQueen?: ActiveQueen | null;
  onQueenUpdated?: () => void;
  variant?: 'card' | 'inline';
};

export const QueenInformation: React.FC<QueenInformationProps> = ({
  activeQueen,
  hiveId,
  onQueenUpdated,
  variant = 'card',
}) => {
  const { t } = useTranslation('queen');
  const [transferOpen, setTransferOpen] = useState(false);

  const transferDialog = activeQueen && (
    <QueenTransferDialog
      queen={activeQueen as QueenResponse}
      open={transferOpen}
      onOpenChange={setTransferOpen}
    />
  );

  if (variant === 'inline') {
    return (
      <div>
        <QueenMobileView
          activeQueen={activeQueen}
          hiveId={hiveId}
          asLink
          onTransferClick={() => setTransferOpen(true)}
          onQueenUpdated={onQueenUpdated}
        />
        <div className="hidden sm:flex items-center gap-3">
          {activeQueen ? (
            <>
              <span className="text-xs text-muted-foreground">Queen:</span>
              <QueenColorDot color={activeQueen.color} />
              <Link to={`/queens/${activeQueen.id}`} className="text-sm font-medium hover:underline">
                {activeQueen.marking}
              </Link>
              <span className="text-xs text-muted-foreground">{activeQueen.year}</span>
              {activeQueen.installedAt && (
                <>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span className="text-xs text-muted-foreground">
                    {formatInstalledDate(activeQueen.installedAt)}
                  </span>
                </>
              )}
              <div className="ml-auto">
                <QueenActionsMenu
                  queen={activeQueen}
                  hiveId={hiveId}
                  onTransferClick={() => setTransferOpen(true)}
                  onQueenUpdated={onQueenUpdated}
                />
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 w-full">
              <NoActiveQueenPrompt hiveId={hiveId} />
            </div>
          )}
        </div>
        {transferDialog}
      </div>
    );
  }

  return (
    <Card className="p-3 sm:p-0">
      <QueenMobileView
        activeQueen={activeQueen}
        hiveId={hiveId}
        onTransferClick={() => setTransferOpen(true)}
        onQueenUpdated={onQueenUpdated}
      />

      {/* Desktop view */}
      <div className="hidden sm:block">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium flex items-center gap-3">
            <QueenColorDot color={activeQueen?.color} size="md" />
            {t('singular')} {activeQueen?.marking}
          </CardTitle>

          <div className="flex items-center space-x-2">
            <BeeIcon className="h-4 w-4 text-muted-foreground" />
            {activeQueen && (
              <QueenActionsMenu
                queen={activeQueen}
                hiveId={hiveId}
                onTransferClick={() => setTransferOpen(true)}
                onQueenUpdated={onQueenUpdated}
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {activeQueen ? (
            <div className="space-y-2">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <CalendarDays className="h-4 w-4 text-muted-foreground" />
                  {activeQueen.installedAt && (
                    <span>
                      {t('fields.installedOn', {
                        date: formatInstalledDate(activeQueen.installedAt),
                      })}
                    </span>
                  )}
                  {activeQueen.source && (
                    <span className="text-muted-foreground">
                      ({t('fields.via', { source: activeQueen.source })})
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3"></div>
              </div>
            </div>
          ) : (
            <NoActiveQueenPrompt hiveId={hiveId} layout="centered" />
          )}
        </CardContent>
        <CardFooter className="flex justify-between text-sm text-muted-foreground">
          <span>{activeQueen?.year}</span>
          <div className="flex gap-1 items-center">-</div>
        </CardFooter>
      </div>

      {transferDialog}
    </Card>
  );
};
