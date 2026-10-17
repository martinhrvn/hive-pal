import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Copy, Download, Share2, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { ShareLinkResponse } from 'shared-schemas';
import { useRevokeShareLink } from '@/api/hooks/useShares';

interface ShareDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shareLink: ShareLinkResponse | null;
}

export function ShareDialog({
  open,
  onOpenChange,
  shareLink,
}: ShareDialogProps) {
  const { t } = useTranslation('share');
  const [copied, setCopied] = useState(false);
  const revokeShareLink = useRevokeShareLink();

  if (!shareLink) return null;

  const shareUrl = shareLink.url;
  const imageUrl = `/api/shares/${shareLink.token}/image?t=${Date.now()}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success(t('dialog.toast.linkCopied'));
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t('dialog.toast.copyFailed'));
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('dialog.nativeShareTitle'),
          url: shareUrl,
        });
      } catch (err) {
        // User cancelled share - ignore
        if ((err as Error).name !== 'AbortError') {
          toast.error(t('dialog.toast.shareFailed'));
        }
      }
    } else {
      handleCopy();
    }
  };

  const handleFacebookShare = () => {
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
      '_blank',
      'width=600,height=400',
    );
  };

  const handleTwitterShare = () => {
    const text = t('dialog.tweetText');
    window.open(
      `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
      '_blank',
      'width=600,height=400',
    );
  };

  const handleDownloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hivepal-share-${shareLink.token}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t('dialog.toast.imageDownloaded'));
    } catch {
      toast.error(t('dialog.toast.downloadFailed'));
    }
  };

  const handleRevoke = async () => {
    try {
      await revokeShareLink.mutateAsync(shareLink.id);
      toast.success(t('dialog.toast.revoked'));
      onOpenChange(false);
    } catch {
      toast.error(t('dialog.toast.revokeFailed'));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t('dialog.title')}</DialogTitle>
          <DialogDescription>{t('dialog.description')}</DialogDescription>
        </DialogHeader>

        {/* Image preview */}
        <div className="rounded-lg overflow-hidden border">
          <img
            src={imageUrl}
            alt={t('dialog.previewAlt')}
            className="w-full h-auto"
            loading="lazy"
          />
        </div>

        {/* Share URL */}
        <div className="flex gap-2">
          <Input value={shareUrl} readOnly className="text-sm" />
          <Button variant="outline" size="icon" onClick={handleCopy}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Share buttons */}
        <div className="grid grid-cols-2 gap-2">
          <Button onClick={handleNativeShare} className="w-full">
            <Share2 className="mr-2 h-4 w-4" />
            {t('dialog.share')}
          </Button>
          <Button
            variant="outline"
            onClick={handleFacebookShare}
            className="w-full"
          >
            {t('dialog.facebook')}
          </Button>
          <Button
            variant="outline"
            onClick={handleTwitterShare}
            className="w-full"
          >
            {t('dialog.twitter')}
          </Button>
          <Button
            variant="outline"
            onClick={handleDownloadImage}
            className="w-full"
          >
            <Download className="mr-2 h-4 w-4" />
            {t('dialog.image')}
          </Button>
        </div>

        <p className="text-xs text-muted-foreground">
          {t('dialog.instagramHint')}
        </p>

        {/* Revoke */}
        <div className="flex justify-end pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive"
            onClick={handleRevoke}
            disabled={revokeShareLink.isPending}
          >
            <Trash2 className="mr-1 h-3 w-3" />
            {t('dialog.revoke')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
