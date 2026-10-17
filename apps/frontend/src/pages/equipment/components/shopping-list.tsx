import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Copy, Printer } from 'lucide-react';
import { EquipmentItemWithCalculations } from 'shared-schemas';
import { useTranslation } from 'react-i18next';
import { useDateFormat } from '@/hooks/use-date-format';

interface ShoppingListProps {
  items: EquipmentItemWithCalculations[];
}

export const ShoppingList = ({ items }: ShoppingListProps) => {
  const { t } = useTranslation('hive');
  const { formatDate } = useDateFormat();
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
    const fullList = `${t('hive:equipment.shoppingList.documentTitle')}\n${formatDate(new Date())}\n\n${shoppingList}`;

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
            <title>${t('hive:equipment.shoppingList.documentTitle')}</title>
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
            <h1>${t('hive:equipment.shoppingList.documentTitle')}</h1>
            <div class="date">${formatDate(new Date())}</div>
            <table>
              <thead>
                <tr>
                  <th>${t('hive:equipment.shoppingList.equipment')}</th>
                  <th style="text-align: right;">${t('hive:equipment.shoppingList.quantity')}</th>
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
            {t('hive:equipment.shoppingList.title')}
          </CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleCopy}>
              <Copy className="h-4 w-4 mr-1" />
              {t('hive:equipment.shoppingList.copy')}
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1" />
              {t('hive:equipment.shoppingList.print')}
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
