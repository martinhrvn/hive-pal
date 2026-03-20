import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  ClipboardCheck,
  Zap,
  Camera,
  FileText,
} from 'lucide-react';
import { useFeatures } from '@/api/hooks';
import { QuickCheckDialog } from '@/pages/hive/hive-detail-page/quick-check-dialog';
import { AddActionDialog } from '@/pages/hive/hive-detail-page/actions/add-action-dialog';
import { AddPhotoDialog } from '@/components/add-photo-dialog';
import { AddDocumentDialog } from '@/components/add-document-dialog';
import { useTranslation } from 'react-i18next';

type ActiveDialog = 'quick-check' | 'action' | 'photo' | 'document' | null;

interface QuickAddMenuProps {
  apiaryId: string;
  hiveId?: string;
  variant?: 'sidebar' | 'inline';
}

export function QuickAddMenu({
  apiaryId,
  hiveId,
  variant = 'inline',
}: QuickAddMenuProps) {
  const { t } = useTranslation('common');
  const [activeDialog, setActiveDialog] = useState<ActiveDialog>(null);
  const { data: features } = useFeatures();

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          {variant === 'sidebar' ? (
            <Button variant="ghost" className="w-full justify-start" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('quickAdd.title', { defaultValue: 'Add Entry' })}
            </Button>
          ) : (
            <Button variant="outline" size="sm">
              <Plus className="mr-2 h-4 w-4" />
              {t('quickAdd.title', { defaultValue: 'Add Entry' })}
            </Button>
          )}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setActiveDialog('quick-check')}>
            <ClipboardCheck className="mr-2 h-4 w-4" />
            {t('quickAdd.quickCheck', { defaultValue: 'Quick Check' })}
          </DropdownMenuItem>
          {hiveId && (
            <DropdownMenuItem onClick={() => setActiveDialog('action')}>
              <Zap className="mr-2 h-4 w-4" />
              {t('quickAdd.action', { defaultValue: 'Action' })}
            </DropdownMenuItem>
          )}
          {features?.storageEnabled && (
            <>
              <DropdownMenuItem onClick={() => setActiveDialog('photo')}>
                <Camera className="mr-2 h-4 w-4" />
                {t('quickAdd.photo', { defaultValue: 'Photo' })}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog('document')}>
                <FileText className="mr-2 h-4 w-4" />
                {t('quickAdd.document', { defaultValue: 'Document' })}
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Dialogs rendered as siblings to avoid Radix portal issues */}
      <QuickCheckDialog
        apiaryId={apiaryId}
        hiveId={hiveId}
        open={activeDialog === 'quick-check'}
        onOpenChange={open => !open && setActiveDialog(null)}
      />

      {hiveId && (
        <AddActionDialog
          hiveId={hiveId}
          open={activeDialog === 'action'}
          onOpenChange={open => !open && setActiveDialog(null)}
        />
      )}

      {features?.storageEnabled && (
        <>
          <AddPhotoDialog
            apiaryId={apiaryId}
            hiveId={hiveId}
            open={activeDialog === 'photo'}
            onOpenChange={open => !open && setActiveDialog(null)}
          />
          <AddDocumentDialog
            apiaryId={apiaryId}
            hiveId={hiveId}
            open={activeDialog === 'document'}
            onOpenChange={open => !open && setActiveDialog(null)}
          />
        </>
      )}
    </>
  );
}
