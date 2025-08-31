import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Copy, Printer } from 'lucide-react';
import { EquipmentCounts } from '@/api/hooks/useEquipment';

interface ShoppingListProps {
  equipmentLabels: Record<string, string>;
  planData: {
    needed: EquipmentCounts;
    consumables?: {
      sugar?: { name: string; needed: number; unit: string };
      syrup?: { name: string; needed: number; unit: string };
    };
    customEquipment?: Array<{
      id: string;
      name: string;
      needed: number;
      unit: string;
    }>;
  };
}

export const ShoppingList = ({ equipmentLabels, planData }: ShoppingListProps) => {
  const hasNeededItems = 
    Object.values(planData.needed).some(count => count > 0) ||
    (planData.consumables?.sugar?.needed ?? 0) > 0 ||
    (planData.consumables?.syrup?.needed ?? 0) > 0 ||
    planData.customEquipment?.some(item => item.needed > 0);

  if (!hasNeededItems) {
    return null;
  }

  const handleCopy = () => {
    // Core equipment items
    const equipmentItems = Object.entries(equipmentLabels)
      .map(([key, label]) => {
        const needed = planData.needed[key as keyof EquipmentCounts];
        return needed > 0 ? `${label}: ${needed}` : null;
      })
      .filter(Boolean);

    // Consumables items
    const consumableItems = [];
    if (planData.consumables?.sugar?.needed && planData.consumables.sugar.needed > 0) {
      consumableItems.push(
        `${planData.consumables.sugar.name}: ${planData.consumables.sugar.needed} ${planData.consumables.sugar.unit}`,
      );
    }
    if (planData.consumables?.syrup?.needed && planData.consumables.syrup.needed > 0) {
      consumableItems.push(
        `${planData.consumables.syrup.name}: ${planData.consumables.syrup.needed} ${planData.consumables.syrup.unit}`,
      );
    }

    // Custom equipment items
    const customItems = planData.customEquipment
      ?.filter(item => item.needed > 0)
      ?.map(item => `${item.name}: ${item.needed} ${item.unit}`) || [];

    // Combine all items
    const allItems = [...equipmentItems, ...consumableItems, ...customItems];
    const shoppingList = allItems.join('\n');
    const fullList = `Equipment Shopping List\n${new Date().toLocaleDateString()}\n\n${shoppingList}`;

    navigator.clipboard.writeText(fullList);
  };

  const handlePrint = () => {
    // Core equipment items
    const equipmentRows = Object.entries(equipmentLabels)
      .map(([key, label]) => {
        const needed = planData.needed[key as keyof EquipmentCounts];
        return needed > 0
          ? `<tr><td style="padding: 8px; border: 1px solid #ddd;">${label}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${needed}</td></tr>`
          : null;
      })
      .filter(Boolean);

    // Consumables rows
    const consumableRows = [];
    if (planData.consumables?.sugar?.needed && planData.consumables.sugar.needed > 0) {
      consumableRows.push(
        `<tr><td style="padding: 8px; border: 1px solid #ddd;">${planData.consumables.sugar.name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${planData.consumables.sugar.needed} ${planData.consumables.sugar.unit}</td></tr>`,
      );
    }
    if (planData.consumables?.syrup?.needed && planData.consumables.syrup.needed > 0) {
      consumableRows.push(
        `<tr><td style="padding: 8px; border: 1px solid #ddd;">${planData.consumables.syrup.name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${planData.consumables.syrup.needed} ${planData.consumables.syrup.unit}</td></tr>`,
      );
    }

    // Custom equipment rows
    const customRows = planData.customEquipment
      ?.filter(item => item.needed > 0)
      ?.map(item =>
        `<tr><td style="padding: 8px; border: 1px solid #ddd;">${item.name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${item.needed} ${item.unit}</td></tr>`,
      ) || [];

    // Combine all rows
    const shoppingList = [...equipmentRows, ...consumableRows, ...customRows].join('');

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
          {/* Core Equipment */}
          {Object.entries(equipmentLabels).map(([key, label]) => {
            const needed = planData.needed[key as keyof EquipmentCounts];
            return needed > 0 ? (
              <div
                key={key}
                className="flex justify-between items-center p-3 bg-muted rounded"
              >
                <span>{label}</span>
                <Badge variant="secondary">{needed}</Badge>
              </div>
            ) : null;
          })}

          {/* Consumables */}
          {planData.consumables?.sugar?.needed && planData.consumables.sugar.needed > 0 && (
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span>{planData.consumables.sugar.name}</span>
              <Badge variant="secondary">
                {planData.consumables.sugar.needed} {planData.consumables.sugar.unit}
              </Badge>
            </div>
          )}
          {planData.consumables?.syrup?.needed && planData.consumables.syrup.needed > 0 && (
            <div className="flex justify-between items-center p-3 bg-muted rounded">
              <span>{planData.consumables.syrup.name}</span>
              <Badge variant="secondary">
                {planData.consumables.syrup.needed} {planData.consumables.syrup.unit}
              </Badge>
            </div>
          )}

          {/* Custom Equipment */}
          {planData.customEquipment
            ?.filter(item => item.needed > 0)
            .map(item => (
              <div
                key={item.id}
                className="flex justify-between items-center p-3 bg-muted rounded"
              >
                <span>{item.name}</span>
                <Badge variant="secondary">
                  {item.needed} {item.unit}
                </Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
};