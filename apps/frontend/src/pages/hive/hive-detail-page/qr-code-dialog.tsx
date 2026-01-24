import { lazy, Suspense, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PrinterIcon, QrCodeIcon } from 'lucide-react';

// Lazy load QR code library
const QRCode = lazy(() =>
  import('react-qr-code').then(m => ({ default: m.default })),
);

function QRLoader() {
  return (
    <div className="flex h-64 w-64 items-center justify-center bg-muted/50 rounded-lg">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
    </div>
  );
}

interface QRCodeDialogProps {
  hiveId: string;
  hiveName: string;
}

export function QRCodeDialog({ hiveId, hiveName }: QRCodeDialogProps) {
  const qrCodeRef = useRef<HTMLDivElement>(null);

  // Construct the full URL for the hive detail page
  const hiveUrl = `${window.location.origin}/hives/${hiveId}`;

  const handlePrint = () => {
    const printContent = qrCodeRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const styles = `
      <style>
        @media print {
          body {
            margin: 0;
            padding: 20px;
            font-family: system-ui, -apple-system, sans-serif;
          }
          .print-container {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
          }
          .hive-name {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 20px;
            text-align: center;
          }
          .qr-container {
            padding: 20px;
            background: white;
            border: 2px solid #000;
            border-radius: 8px;
          }
          .hive-url {
            margin-top: 20px;
            font-size: 14px;
            text-align: center;
            word-break: break-all;
          }
          @page {
            size: A4;
            margin: 20mm;
          }
        }
      </style>
    `;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Code - ${hiveName}</title>
          ${styles}
        </head>
        <body>
          <div class="print-container">
            <h1 class="hive-name">${hiveName}</h1>
            <div class="qr-container">
              ${printContent.innerHTML}
            </div>
            <p class="hive-url">${hiveUrl}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();

    // Wait for content to render before printing
    printWindow.onload = () => {
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    };
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" className="w-full justify-start" size="sm">
          <QrCodeIcon className="mr-2 h-4 w-4" />
          QR Code
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>QR Code for {hiveName}</DialogTitle>
          <DialogDescription>
            Scan this QR code to quickly access this hive's detail page
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col items-center space-y-4 py-4">
          <div ref={qrCodeRef} className="bg-white p-4 rounded-lg border">
            <Suspense fallback={<QRLoader />}>
              <QRCode
                value={hiveUrl}
                size={256}
                level="H"
                bgColor="#ffffff"
                fgColor="#000000"
              />
            </Suspense>
          </div>
          <div className="text-sm text-muted-foreground text-center break-all max-w-full px-4">
            {hiveUrl}
          </div>
          <Button onClick={handlePrint} className="w-full" variant="default">
            <PrinterIcon className="mr-2 h-4 w-4" />
            Print QR Code
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
