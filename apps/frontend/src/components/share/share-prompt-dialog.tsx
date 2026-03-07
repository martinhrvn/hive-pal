import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Share2 } from 'lucide-react';
import { isCloudMode } from '@/utils/feature-flags';
import { useCreateShareLink } from '@/api/hooks/useShares';
import { ShareDialog } from './share-dialog';
import {
  ShareResourceType,
  ShareLinkResponse,
} from 'shared-schemas';

const STORAGE_KEY = 'hivepal-share-prompt-dismissed';

function isDismissed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function setDismissed(): void {
  try {
    localStorage.setItem(STORAGE_KEY, 'true');
  } catch {
    // silently fail
  }
}

interface SharePromptDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resourceType: ShareResourceType;
  resourceId: string;
  title?: string;
}

export function SharePromptDialog({
  open,
  onOpenChange,
  resourceType,
  resourceId,
  title,
}: SharePromptDialogProps) {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [shareLink, setShareLink] = useState<ShareLinkResponse | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const createShareLink = useCreateShareLink();

  if (!isCloudMode()) return null;

  const resourceLabel =
    resourceType === ShareResourceType.HARVEST ? 'harvest' : 'inspection';

  const handleShare = async () => {
    try {
      const result = await createShareLink.mutateAsync({
        resourceType,
        resourceId,
      });
      setShareLink(result);
      onOpenChange(false);
      setShowShareDialog(true);
    } catch {
      // Error handled by mutation
    }
  };

  const handleSkip = () => {
    if (dontShowAgain) {
      setDismissed();
    }
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {title || `${resourceLabel.charAt(0).toUpperCase() + resourceLabel.slice(1)} saved!`}
            </DialogTitle>
            <DialogDescription>
              Share your {resourceLabel} results with friends and fellow
              beekeepers?
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="dont-show-again"
                checked={dontShowAgain}
                onCheckedChange={(checked) =>
                  setDontShowAgain(checked === true)
                }
              />
              <Label
                htmlFor="dont-show-again"
                className="text-sm text-muted-foreground cursor-pointer"
              >
                Don't show this again
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={handleSkip}
              >
                Skip
              </Button>
              <Button
                onClick={handleShare}
                disabled={createShareLink.isPending}
              >
                <Share2 className="mr-2 h-4 w-4" />
                {createShareLink.isPending ? 'Creating...' : 'Share'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ShareDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        shareLink={shareLink}
      />
    </>
  );
}

export { isDismissed as isSharePromptDismissed };
