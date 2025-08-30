import { useState } from 'react';
import { useHives } from '@/api/hooks/useHives';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { PrinterIcon, QrCodeIcon, ImageIcon } from 'lucide-react';
import QRCode from 'react-qr-code';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';

export function QRCodesPrintPage() {
  const { data: hives, isLoading } = useHives();
  const [selectedHives, setSelectedHives] = useState<Set<string>>(new Set());
  const [qrSize, setQrSize] = useState<'small' | 'medium' | 'large'>('large');
  const [layout, setLayout] = useState<'2x3' | '2x4' | '3x3'>('2x3');
  const [includeLogo, setIncludeLogo] = useState(true);
  const logoUrl = '/favicon.ico'; // Default to favicon, can be customized

  const toggleHiveSelection = (hiveId: string) => {
    const newSelection = new Set(selectedHives);
    if (newSelection.has(hiveId)) {
      newSelection.delete(hiveId);
    } else {
      newSelection.add(hiveId);
    }
    setSelectedHives(newSelection);
  };

  const selectAll = () => {
    if (hives) {
      setSelectedHives(new Set(hives.map(h => h.id)));
    }
  };

  const clearSelection = () => {
    setSelectedHives(new Set());
  };

  const getQRSize = () => {
    switch (qrSize) {
      case 'small':
        return 480;
      case 'medium':
        return 640;
      case 'large':
        return 960;
      default:
        return 960;
    }
  };

  const getLayoutGrid = () => {
    switch (layout) {
      case '2x3':
        return { cols: 2, rows: 3, perPage: 6 };
      case '2x4':
        return { cols: 2, rows: 4, perPage: 8 };
      case '3x3':
        return { cols: 3, rows: 3, perPage: 9 };
      default:
        return { cols: 2, rows: 3, perPage: 6 };
    }
  };

  const handlePrint = () => {
    const selectedHiveData = hives?.filter(h => selectedHives.has(h.id)) || [];
    if (selectedHiveData.length === 0) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const gridLayout = getLayoutGrid();
    const qrCodeSize = getQRSize();

    const styles = `
      <style>
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
        }
        body {
          margin: 0;
          padding: 0;
          font-family: system-ui, -apple-system, sans-serif;
        }
        .print-container {
          display: grid;
          grid-template-columns: repeat(${gridLayout.cols}, 1fr);
          grid-template-rows: repeat(${gridLayout.rows}, 1fr);
          gap: 20px;
          padding: 20px;
          page-break-after: always;
        }
        .qr-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .qr-code-wrapper {
          padding: 10px;
          background: white;
          position: relative;
        }
        .qr-logo {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 4px;
          border-radius: 4px;
          box-shadow: 0 0 0 2px white;
          z-index: 10;
        }
        .hive-name {
          margin-top: 10px;
          font-size: 14px;
          font-weight: 600;
          text-align: center;
          max-width: 100%;
          word-break: break-word;
        }
      </style>
    `;

    // Split QR codes into pages
    const pages = [];
    for (let i = 0; i < selectedHiveData.length; i += gridLayout.perPage) {
      const pageItems = selectedHiveData.slice(i, i + gridLayout.perPage);
      const pageHTML = pageItems
        .map(hive => {
          return `
          <div class="qr-item">
            <div class="qr-code-wrapper" id="qr-${hive.id}">
              ${includeLogo ? `<img class="qr-logo" id="logo-${hive.id}" style="display:none;" />` : ''}
            </div>
            <div class="hive-name">${hive.name}</div>
          </div>
        `;
        })
        .join('');
      pages.push(`<div class="print-container">${pageHTML}</div>`);
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Codes - Hive Labels</title>
          ${styles}
          <script src="https://unpkg.com/qrcode-generator@1.4.4/qrcode.js"></script>
        </head>
        <body>
          ${pages.join('')}
          <script>
            ${selectedHiveData
              .map(hive => {
                const hiveUrl = `${window.location.origin}/hives/${hive.id}`;
                return `
                (function() {
                  var typeNumber = 0;
                  var errorCorrectionLevel = 'H';
                  var qr = qrcode(typeNumber, errorCorrectionLevel);
                  qr.addData('${hiveUrl}');
                  qr.make();
                  var element = document.getElementById('qr-${hive.id}');
                  if (element) {
                    var qrSvg = qr.createSvgTag(${qrCodeSize / 256});
                    ${
                      includeLogo
                        ? `
                    // Insert QR code first, then configure logo
                    var logo = element.querySelector('.qr-logo');
                    element.insertAdjacentHTML('afterbegin', qrSvg);
                    
                    if (logo) {
                      logo.src = '${logoUrl}';
                      var logoSize = Math.min(${qrCodeSize} * 0.15, 48); // Logo is 15% of QR code size, max 48px
                      logo.style.width = logoSize + 'px';
                      logo.style.height = logoSize + 'px';
                      logo.style.display = 'block';
                      logo.style.objectFit = 'contain';
                    }
                    `
                        : `
                    // No logo, just insert QR code
                    element.innerHTML = qrSvg;
                    `
                    }
                  }
                })();
              `;
              })
              .join('\n')}
            
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.close();
              }, 500); // Small delay to ensure logos load
            };
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCodeIcon className="h-6 w-6" />
            Bulk QR Code Printing
          </CardTitle>
          <CardDescription>
            Select hives to generate and print QR code labels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Print Settings */}
          <div className="flex flex-wrap gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="qr-size">QR Code Size</Label>
              <Select
                value={qrSize}
                onValueChange={(value: 'small' | 'medium' | 'large') =>
                  setQrSize(value)
                }
              >
                <SelectTrigger id="qr-size">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (480px)</SelectItem>
                  <SelectItem value="medium">Medium (640px)</SelectItem>
                  <SelectItem value="large">Large (960px)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Label htmlFor="layout">Page Layout</Label>
              <Select
                value={layout}
                onValueChange={(value: '2x3' | '2x4' | '3x3') =>
                  setLayout(value)
                }
              >
                <SelectTrigger id="layout">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2x3">2×3 (6 per page)</SelectItem>
                  <SelectItem value="2x4">2×4 (8 per page)</SelectItem>
                  <SelectItem value="3x3">3×3 (9 per page)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center space-x-2 min-w-[200px]">
              <Switch
                id="include-logo"
                checked={includeLogo}
                onCheckedChange={setIncludeLogo}
              />
              <Label
                htmlFor="include-logo"
                className="flex items-center gap-2 cursor-pointer"
              >
                <ImageIcon className="h-4 w-4" />
                Include Logo
              </Label>
            </div>
          </div>

          {/* Selection Controls */}
          <div className="flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              {selectedHives.size} of {hives?.length || 0} hives selected
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="outline" size="sm" onClick={clearSelection}>
                Clear Selection
              </Button>
            </div>
          </div>

          {/* Hive List */}
          <div className="border rounded-lg max-h-96 overflow-y-auto">
            <div className="divide-y">
              {hives?.map(hive => (
                <div
                  key={hive.id}
                  className="flex items-center space-x-3 p-3 hover:bg-muted/50 cursor-pointer"
                  onClick={() => toggleHiveSelection(hive.id)}
                >
                  <Checkbox
                    checked={selectedHives.has(hive.id)}
                    onCheckedChange={() => toggleHiveSelection(hive.id)}
                    onClick={e => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <div className="font-medium">{hive.name}</div>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCodeIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">QR Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview Section */}
          {selectedHives.size > 0 && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="text-sm font-medium mb-2">Preview</div>
              <div className="flex flex-wrap gap-4">
                {Array.from(selectedHives)
                  .slice(0, 4)
                  .map(hiveId => {
                    const hive = hives?.find(h => h.id === hiveId);
                    if (!hive) return null;
                    const hiveUrl = `${window.location.origin}/hives/${hiveId}`;
                    return (
                      <div
                        key={hiveId}
                        className="flex flex-col items-center p-2 bg-white rounded border"
                      >
                        <div className="relative">
                          <QRCode
                            value={hiveUrl}
                            size={80}
                            level="H"
                            bgColor="#ffffff"
                            fgColor="#000000"
                          />
                          {includeLogo && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="bg-white p-0.5 rounded shadow-sm">
                                <img
                                  src={logoUrl}
                                  alt="Logo"
                                  className="w-4 h-4"
                                  onError={e => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="text-xs mt-1 text-center max-w-[80px] truncate">
                          {hive.name}
                        </div>
                      </div>
                    );
                  })}
                {selectedHives.size > 4 && (
                  <div className="flex items-center justify-center p-2">
                    <span className="text-sm text-muted-foreground">
                      +{selectedHives.size - 4} more
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Print Button */}
          <Button
            className="w-full"
            size="lg"
            onClick={handlePrint}
            disabled={selectedHives.size === 0}
          >
            <PrinterIcon className="mr-2 h-5 w-5" />
            Print {selectedHives.size} QR Code
            {selectedHives.size !== 1 ? 's' : ''}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
