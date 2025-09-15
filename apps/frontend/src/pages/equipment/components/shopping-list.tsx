import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Copy, Printer } from 'lucide-react';
import { EquipmentItemWithCalculations } from 'shared-schemas';

interface ShoppingListProps {
  items: EquipmentItemWithCalculations[];
}

export const ShoppingList = ({ items }: ShoppingListProps) => {
  const neededItems = items.filter(
    item => item.enabled && (item.toPurchase || 0) > 0,
  );
  const hasNeededItems = neededItems.length > 0;

  if (!hasNeededItems) {
    return null;
  }

  const handleCopy = () => {
    const shoppingItems = neededItems.map(item => {
      const name =
        item.name ||
        item.itemId
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
      return `${name}: ${item.toPurchase} ${item.unit}`;
    });

    const shoppingList = shoppingItems.join('\n');
    const fullList = `Equipment Shopping List\n${new Date().toLocaleDateString()}\n\n${shoppingList}`;

    navigator.clipboard.writeText(fullList);
  };

  const handlePrint = () => {
    const shoppingRows = neededItems.map(item => {
      const name =
        item.name ||
        item.itemId
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
      return `<tr><td style="padding: 8px; border: 1px solid #ddd;">${name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.toPurchase} ${item.unit}</td></tr>`;
    });

    const shoppingList = shoppingRows.join('');

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Equipment Shopping List</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              h1 { color: #333; }
              table { width: 100%; max-width: 500px; border-collapse: collapse; margin-top: 20px; }
              th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }
              .date { color: #666; margin-bottom: 20px; }
              @media print {
                body { padding: 10px; }
              }
            </style>
          </head>
          <body>
            <h1>Equipment Shopping List</h1>
            <div class="date">${new Date().toLocaleDateString()}</div>
            <table>
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th style="text-align: right;">Quantity</th>
                </tr>
              </thead>
              <tbody>
                ${shoppingList}
              </tbody>
            </table>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Shopping List
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              Copy
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {neededItems.map(item => {
            const name =
              item.name ||
              item.itemId
                .replace(/([A-Z])/g, ' $1')
                .replace(/^./, str => str.toUpperCase());
            return (
              <div
                key={item.itemId}
                className="flex justify-between items-center p-3 bg-muted rounded"
              >
                <span>{name}</span>
                <Badge variant="secondary">
                  {item.toPurchase} {item.unit}
                </Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
