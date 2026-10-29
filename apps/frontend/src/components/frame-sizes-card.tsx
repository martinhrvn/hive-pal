import { useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';
import { FrameSize, UpdateFrameSizeDto } from 'shared-schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Ruler } from 'lucide-react';
import { useFrameSizes, useUpdateFrameSize, useUserProfile } from '@/api/hooks';
import { FrameSizeStatusBadge } from '@/components/common/frame-size-status-badge';
import { FrameSizeEditDialog } from './frame-size-edit-dialog';

/**
 * Settings card for the custom frame sizes the user created. Editing one
 * corrects it everywhere: boxes reference the frame size by id, so every hive
 * using it picks up the new name and dimensions without re-selecting.
 *
 * The view is exported separately so component tests and the story gallery can
 * render it without the network.
 */

export interface FrameSizesCardViewProps {
  sizes: FrameSize[];
  currentUserId?: string;
  isLoading?: boolean;
  onSave: (id: string, data: UpdateFrameSizeDto) => Promise<void>;
}

const FrameSizeRowSkeleton = () => (
  <div className="rounded-md border px-3 py-2">
    <div className="flex items-center justify-between gap-3">
      <div className="space-y-1.5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-40" />
      </div>
      <Skeleton className="size-8" />
    </div>
  </div>
);

const FrameSizesSkeleton = () => {
  const { t } = useTranslation('common');

  return (
    <output
      className="block space-y-2"
      aria-label={t('status.loading', { defaultValue: 'Loading...' })}
    >
      <FrameSizeRowSkeleton />
      <FrameSizeRowSkeleton />
    </output>
  );
};

const FrameSizesEmptyState = () => {
  const { t } = useTranslation('common');

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        {t('frameSizes.empty', {
          defaultValue:
            "No custom frame sizes yet: add one while editing a hive's boxes.",
        })}
      </p>
      <Button asChild variant="outline" size="sm">
        <Link to="/hives">
          {t('frameSizes.emptyCta', { defaultValue: 'Go to hives' })}
        </Link>
      </Button>
    </div>
  );
};

const FrameSizeList = ({
  sizes,
  onEdit,
}: {
  sizes: FrameSize[];
  onEdit: (size: FrameSize) => void;
}) => {
  const { t } = useTranslation('common');

  return (
    <ul className="space-y-2">
      {sizes.map(size => (
        <li
          key={size.id}
          data-test="frame-size-row"
          className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
        >
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">{size.name}</span>
              <FrameSizeStatusBadge status={size.status} />
            </div>
            <div className="text-xs text-muted-foreground">
              {t('frameSizes.dimensions', {
                defaultValue: '{{width}} × {{height}} × {{depth}} mm',
                width: size.width,
                height: size.height,
                depth: size.depth,
              })}
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0"
            aria-label={t('actions.edit', { defaultValue: 'Edit' })}
            data-test="edit-frame-size"
            onClick={() => onEdit(size)}
          >
            <Pencil className="size-4" />
          </Button>
        </li>
      ))}
    </ul>
  );
};

export const FrameSizesCardView = ({
  sizes,
  currentUserId,
  isLoading = false,
  onSave,
}: FrameSizesCardViewProps) => {
  const { t } = useTranslation('common');
  const [editing, setEditing] = useState<FrameSize | null>(null);

  const mySizes = sizes.filter(
    size => !size.isBuiltIn && size.createdByUserId === currentUserId,
  );

  let body: ReactNode;
  if (isLoading) {
    body = <FrameSizesSkeleton />;
  } else if (mySizes.length === 0) {
    body = <FrameSizesEmptyState />;
  } else {
    body = <FrameSizeList sizes={mySizes} onEdit={size => setEditing(size)} />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="size-5" />
          {t('frameSizes.title', { defaultValue: 'My frame sizes' })}
        </CardTitle>
        <CardDescription>
          {t('frameSizes.description', {
            defaultValue:
              'Custom frame sizes you created. Editing one updates every box that uses it.',
          })}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {body}

        {editing ? (
          <FrameSizeEditDialog
            key={editing.id}
            frameSize={editing}
            onClose={() => setEditing(null)}
            onSave={onSave}
          />
        ) : null}
      </CardContent>
    </Card>
  );
};

export const FrameSizesCard = () => {
  const { data: sizes = [], isLoading } = useFrameSizes();
  const { data: currentUser, isLoading: isUserLoading } = useUserProfile();
  const updateFrameSize = useUpdateFrameSize();

  const handleSave = async (id: string, data: UpdateFrameSizeDto) => {
    await updateFrameSize.mutateAsync({ id, data });
  };

  return (
    <FrameSizesCardView
      sizes={sizes}
      currentUserId={currentUser?.id}
      isLoading={isLoading || isUserLoading}
      onSave={handleSave}
    />
  );
};
