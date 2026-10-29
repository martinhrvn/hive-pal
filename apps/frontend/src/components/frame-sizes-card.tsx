import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FrameSize, FrameSizeStatus, UpdateFrameSizeDto } from 'shared-schemas';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Pencil, Ruler } from 'lucide-react';
import { useFrameSizes, useUpdateFrameSize, useUserProfile } from '@/api/hooks';
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

const FrameSizeStatusBadge = ({ status }: { status: FrameSize['status'] }) => {
  const { t } = useTranslation('common');

  if (status === FrameSizeStatus.APPROVED) {
    return (
      <Badge variant="outline">
        {t('frameSizes.statusShared', { defaultValue: 'Shared' })}
      </Badge>
    );
  }
  if (status === FrameSizeStatus.REJECTED) {
    return (
      <Badge variant="destructive">
        {t('frameSizes.statusRejected', { defaultValue: 'Rejected' })}
      </Badge>
    );
  }
  return (
    <Badge variant="secondary">
      {t('frameSizes.statusPending', { defaultValue: 'Pending review' })}
    </Badge>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="h-5 w-5" />
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
        {isLoading ? (
          <Loader2
            className="h-5 w-5 animate-spin text-muted-foreground"
            aria-label={t('status.loading', { defaultValue: 'Loading...' })}
          />
        ) : mySizes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {t('frameSizes.empty', {
              defaultValue:
                "No custom frame sizes yet — add one while editing a hive's boxes.",
            })}
          </p>
        ) : (
          <ul className="space-y-2">
            {mySizes.map(size => (
              <li
                key={size.id}
                data-test="frame-size-row"
                className="flex items-center justify-between gap-3 rounded-md border px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium truncate">{size.name}</span>
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
                  className="h-8 w-8 shrink-0"
                  aria-label={t('actions.edit', { defaultValue: 'Edit' })}
                  data-test="edit-frame-size"
                  onClick={() => setEditing(size)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </li>
            ))}
          </ul>
        )}

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
  const { data: currentUser } = useUserProfile();
  const updateFrameSize = useUpdateFrameSize();
  const { mutateAsync } = updateFrameSize;

  const handleSave = useCallback(
    async (id: string, data: UpdateFrameSizeDto) => {
      await mutateAsync({ id, data });
    },
    [mutateAsync],
  );

  return (
    <FrameSizesCardView
      sizes={sizes}
      currentUserId={currentUser?.id}
      isLoading={isLoading}
      onSave={handleSave}
    />
  );
};
