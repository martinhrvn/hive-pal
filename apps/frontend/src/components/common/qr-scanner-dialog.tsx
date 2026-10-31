import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertCircle, Camera } from 'lucide-react';
import { useQrScanner } from '@/hooks/use-qr-scanner';

interface QrScannerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QrScannerDialog({ open, onOpenChange }: QrScannerDialogProps) {
  const { t } = useTranslation('common');
  const navigate = useNavigate();

  const handleScan = useCallback(
    (data: string): boolean => {
      try {
        const url = new URL(data);
        if (url.origin !== window.location.origin) {
          return false;
        }
        onOpenChange(false);
        navigate(url.pathname + url.search + url.hash);
        return true;
      } catch {
        return false;
      }
    },
    [navigate, onOpenChange],
  );

  const {
    error,
    isSupported,
    videoRef,
    canvasRef,
    startScanning,
    stopScanning,
  } = useQrScanner(handleScan);

  useEffect(() => {
    if (open) {
      startScanning();
    } else {
      stopScanning();
    }
  }, [open, startScanning, stopScanning]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t('qrScanner.title')}</DialogTitle>
          <DialogDescription>{t('qrScanner.description')}</DialogDescription>
        </DialogHeader>

        <div className="relative overflow-hidden rounded-lg bg-black aspect-square">
          {!isSupported ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <Camera className="h-12 w-12 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t('qrScanner.cameraUnavailable')}
              </p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 p-6 text-center">
              <AlertCircle className="h-12 w-12 text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" size="sm" onClick={startScanning}>
                {t('actions.tryAgain')}
              </Button>
            </div>
          ) : (
            <>
              <video
                ref={videoRef}
                className="w-full h-full object-cover"
                autoPlay
                playsInline
                muted
              />
              {/* Viewfinder overlay */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-2/3 aspect-square border-2 border-white/70 rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.3)]" />
              </div>
            </>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>
      </DialogContent>
    </Dialog>
  );
}
